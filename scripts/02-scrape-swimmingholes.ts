#!/usr/bin/env npx tsx
/**
 * Scrape swimming holes from swimmingholes.org
 *
 * Usage:
 *   npx tsx scripts/02-scrape-swimmingholes.ts [--dry-run] [--limit N] [--state XX]
 *
 * The script:
 * 1. Fetches state pages from swimmingholes.org
 * 2. Parses HTML tables to extract swimming hole data
 * 3. Transforms to our schema
 * 4. Inserts into Supabase (upserts by source_id)
 */

import * as cheerio from 'cheerio';
import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { slugify, chunk, sleep } from './lib/utils';
import { config } from './lib/config';
import { filterNewSprings, clearSpringCache } from './lib/dedup';

const log = createLogger('SwimmingHoles');

// Constants
const FETCH_TIMEOUT_MS = 30000; // 30 seconds
const DESCRIPTION_MAX_LENGTH = 1500;

// All US state codes
const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

interface RawEntry {
  name: string;
  state: string;
  lat: number | null;
  lng: number | null;
  water: string;
  type: string;
  description: string;
  sanction: string;
  fee: string;
  facilities: string;
  bathingSuits: string;
  camping: string;
  confidence: string;
  directions: string;
  parentArea?: string; // For sub-places within area entries
}

interface SubPlace {
  name: string;
  code: string;
  description: string;
  lat: number;
  lng: number;
}

/**
 * Check if entry name indicates an area with multiple places
 * Returns the number of places or null if not an area
 */
function isAreaEntry(name: string): number | null {
  const match = name.match(/\[(\d+)\s*PLACES?\]/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse sub-places from DIRECTIONS field HTML
 * Formats seen (various color codes and bold arrangements):
 * - <font color="red">NAME [CODE]:</font>
 * - <font color="red"><b>NAME [CODE]:</b></font>
 * - <b><font color="red"><b>NAME [CODE]:</b></font></b>
 * - <font color="#cc0000">NAME [CODE]:</font>
 * - Extra bold tags: </b><b><font...><b>NAME [CODE]:</b></font>
 */
function parseSubPlaces(directionsHtml: string): SubPlace[] {
  const subPlaces: SubPlace[] = [];

  // Multiple regex patterns to catch different formats (no global flag - use matchAll)
  const patterns = [
    // Standard: <font color="red">NAME [CODE]:</font>
    /<font color=["']?(?:red|#[cf][cf]0000)["']?>\s*(?:<b>)?([A-Z][A-Z0-9 .&;'-]+?)\s*\[([A-Z]{3,5})\]:\s*(?:<\/b>)?<\/font>/gi,
    // With extra bold wrapper: <b><font color="red"><b>NAME [CODE]:</b></font>
    /<b><font color=["']?(?:red|#[cf][cf]0000)["']?><b>([A-Z][A-Z0-9 .&;'-]+?)\s*\[([A-Z]{3,5})\]:<\/b><\/font>/gi,
  ];

  const matches: Array<{ name: string; code: string; index: number; endIndex: number }> = [];
  const seenIndices = new Set<number>();

  for (const pattern of patterns) {
    // Create fresh regex instance to avoid global flag state issues
    const regex = new RegExp(pattern.source, pattern.flags);
    for (const match of directionsHtml.matchAll(regex)) {
      // Avoid duplicates from overlapping patterns
      if (seenIndices.has(match.index!)) continue;
      seenIndices.add(match.index!);

      matches.push({
        name: match[1].trim().replace(/&nbsp;/g, ' ').replace(/\s+/g, ' '),
        code: match[2],
        index: match.index!,
        endIndex: match.index! + match[0].length,
      });
    }
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Extract content between each sub-place marker
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    // Section starts after the header and ends at next header (or end of HTML)
    const nextIndex = i < matches.length - 1 ? matches[i + 1].index : directionsHtml.length;
    const section = directionsHtml.slice(current.endIndex, nextIndex);

    // Extract coordinates from this section
    const coords = parseCoords(section);

    if (coords.lat && coords.lng) {
      // Clean description: strip HTML tags, limit length
      const cleanDesc = section
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);

      subPlaces.push({
        name: current.name,
        code: current.code,
        description: cleanDesc,
        lat: coords.lat,
        lng: coords.lng,
      });
    }
  }

  return subPlaces;
}

/**
 * Parse coordinates from LAT,LON field
 * Formats:
 * - "lat=32.95169, lon=-116.30582(source:UScampgrounds) (accuracy: exact)"
 * - Google Maps URL: "maps.google.com/maps?&z=10&q=36.25026+-121.78214"
 * - Just numbers in text with Google link
 */
function parseCoords(text: string): { lat: number | null; lng: number | null } {
  // Try explicit lat=/lon= format first
  const latMatch = text.match(/lat[=:]?\s*(-?\d+\.?\d*)/i);
  const lonMatch = text.match(/lon[=:]?\s*(-?\d+\.?\d*)/i);

  if (latMatch && lonMatch) {
    return {
      lat: parseFloat(latMatch[1]),
      lng: parseFloat(lonMatch[1]),
    };
  }

  // Try Google Maps URL format: q=LAT+LNG or q=LAT+-LNG
  const googleMatch = text.match(/maps\.google\.com\/maps\?[^"]*q=(-?\d+\.?\d*)\+(-?\d+\.?\d*)/);
  if (googleMatch) {
    return {
      lat: parseFloat(googleMatch[1]),
      lng: parseFloat(googleMatch[2]),
    };
  }

  return { lat: null, lng: null };
}

/**
 * Extract entries from HTML using cheerio (safe HTML parser)
 *
 * HTML structure:
 * <table>
 *   <tr>
 *     <th bgcolor="#cccccc"><h3><font color="#ff0000">NAME<br>(ABBR)</font></h3></th>
 *     <td>...</td>
 *   </tr>
 *   <tr><th>TOWNS</th><td>...</td></tr>
 *   <tr><th>LAT, LON</th><td>lat=X, lon=Y...</td></tr>
 *   ... more data rows ...
 * </table>
 *
 * Area entries have format: "AREA NAME [N PLACES] (ABBR)" and contain
 * sub-places in the DIRECTIONS field with their own coordinates.
 */
function parseStateHtml(html: string, stateCode: string): RawEntry[] {
  const entries: RawEntry[] = [];
  const $ = cheerio.load(html);
  const processedNames = new Set<string>(); // Avoid duplicates from nested tables

  // Find all tables that contain entry data (have th with red font h3)
  $('table').each((_, tableEl) => {
    const table = $(tableEl);

    // Check if this table has a header row with red font (entry marker)
    const headerTh = table.find('th').first();
    const fontEl = headerTh.find('font[color="#ff0000"]');
    if (!fontEl.length) return;

    // Extract name from the font element text
    const fontText = fontEl.text().trim();
    // Name is before the abbreviation in parentheses, clean up line breaks
    const cleanText = fontText.replace(/\s+/g, ' ').trim();
    const nameMatch = cleanText.match(/^([^(\[]+)/);
    if (!nameMatch) return;

    const name = nameMatch[1].trim();
    if (!name || name.length < 2) return;

    // Skip if we've already processed this entry (nested tables cause duplicates)
    const entryKey = `${name}-${stateCode}`;
    if (processedNames.has(entryKey)) return;
    processedNames.add(entryKey);

    // Check if this is an area entry with multiple places
    const placeCount = isAreaEntry(fontText);

    const entry: Partial<RawEntry> = { name, state: stateCode };
    let directionsHtml = ''; // Keep raw HTML for sub-place parsing

    // Parse each row in this table for data fields
    table.find('tr').each((_, rowEl) => {
      const row = $(rowEl);
      const th = row.find('th').first();
      const td = row.find('td').first();

      if (!th.length || !td.length) return;

      // Get field name, normalizing whitespace
      const field = th.text().replace(/\s+/g, ' ').trim().toUpperCase();
      const value = td.text().trim();

      switch (field) {
        case 'LAT, LON':
        case 'LAT,LON':
          const coords = parseCoords(value);
          entry.lat = coords.lat;
          entry.lng = coords.lng;
          break;
        case 'WATER':
          entry.water = value;
          break;
        case 'TYPE':
          entry.type = value;
          break;
        case 'DESCRIPTION':
          entry.description = value;
          break;
        case 'SANCTION':
          entry.sanction = value;
          break;
        case 'FEE':
          entry.fee = value;
          break;
        case 'FACILITIES':
          entry.facilities = value;
          break;
        case 'BATHING SUITS':
          entry.bathingSuits = value;
          break;
        case 'CAMPING':
          entry.camping = value;
          break;
        case 'CONFIDENCE':
          entry.confidence = value;
          break;
        case 'DIRECTIONS':
          entry.directions = value;
          directionsHtml = td.html() || ''; // Keep HTML for sub-place parsing
          break;
      }
    });

    // Handle area entries with sub-places
    if (placeCount && placeCount > 1 && directionsHtml) {
      const subPlaces = parseSubPlaces(directionsHtml);

      for (const sub of subPlaces) {
        entries.push({
          name: sub.name,
          state: stateCode,
          lat: sub.lat,
          lng: sub.lng,
          water: entry.water || '',
          type: entry.type || '',
          description: sub.description || entry.description || '',
          sanction: entry.sanction || '',
          fee: entry.fee || '',
          facilities: entry.facilities || '',
          bathingSuits: entry.bathingSuits || '',
          camping: entry.camping || '',
          confidence: entry.confidence || '',
          directions: sub.description || '',
          parentArea: name, // Track parent area for unique source_id
        });
      }

      // If no sub-places found but parent has coords, still include parent
      if (subPlaces.length === 0 && entry.lat && entry.lng) {
        entries.push(entry as RawEntry);
      }
    } else {
      // Standard single-place entry
      if (entry.name && entry.lat && entry.lng) {
        entries.push(entry as RawEntry);
      }
    }
  });

  return entries;
}

/**
 * Determine spring type from water type description
 */
function determineSpringType(water: string, type: string): 'hot' | 'warm' | 'cold' {
  const combined = `${water} ${type}`.toLowerCase();

  if (combined.includes('hot spring') || combined.includes('thermal') || combined.includes('hot pool')) {
    return 'hot';
  }
  if (combined.includes('warm spring') || combined.includes('warm water')) {
    return 'warm';
  }
  // Default to cold for swimming holes
  return 'cold';
}

/**
 * Determine experience type from facilities and sanction
 */
function determineExperienceType(
  sanction: string,
  facilities: string,
  fee: string
): 'resort' | 'primitive' | 'hybrid' {
  const facilitiesLower = facilities?.toLowerCase() || '';
  const feeLower = fee?.toLowerCase() || '';

  // Resort indicators
  const hasFullFacilities =
    facilitiesLower.includes('all facilities') ||
    facilitiesLower.includes('restroom') ||
    facilitiesLower.includes('shower');
  const isPaid = feeLower.includes('yes') || feeLower.includes('fee') || feeLower.includes('$');

  if (hasFullFacilities && isPaid) {
    return 'resort';
  }
  if (hasFullFacilities || isPaid) {
    return 'hybrid';
  }
  return 'primitive';
}

/**
 * Determine fee type
 */
function determineFeeType(fee: string): 'free' | 'paid' | 'donation' | 'unknown' {
  const lower = fee?.toLowerCase() || '';
  if (lower.includes('free') || lower.includes('no fee') || lower === 'no') {
    return 'free';
  }
  if (lower.includes('yes') || lower.includes('fee') || lower.includes('$') || lower.includes('paid')) {
    return 'paid';
  }
  if (lower.includes('donation')) {
    return 'donation';
  }
  return 'unknown';
}

/**
 * Determine clothing optional status
 */
function determineClothingOptional(bathingSuits: string): 'yes' | 'no' | 'unofficial' | 'unknown' {
  const lower = bathingSuits?.toLowerCase() || '';
  if (lower.includes('optional') || lower.includes('nude') || lower.includes('clothing optional')) {
    if (lower.includes('unofficial') || lower.includes('tolerated')) {
      return 'unofficial';
    }
    return 'yes';
  }
  if (lower.includes('required') || lower.includes('must wear')) {
    return 'no';
  }
  return 'unknown';
}

/**
 * Map confidence string to our enum
 */
function mapConfidence(confidence: string): 'high' | 'medium' | 'low' {
  const lower = confidence?.toLowerCase() || '';
  if (lower.includes('very confident') || lower.includes('certain')) {
    return 'high';
  }
  if (lower.includes('confident') || lower.includes('probably')) {
    return 'medium';
  }
  return 'low';
}

function transformToSpring(entry: RawEntry) {
  const springType = determineSpringType(entry.water || '', entry.type || '');
  const experienceType = determineExperienceType(
    entry.sanction || '',
    entry.facilities || '',
    entry.fee || ''
  );

  // Build description
  let description = entry.description || '';
  if (!description || description.length < 10) {
    description = `${entry.name} is a ${springType === 'hot' ? 'hot spring' : 'swimming hole'} in ${entry.state}.`;
    if (entry.type) description += ` Type: ${entry.type}.`;
    if (entry.water) description += ` Water: ${entry.water}.`;
  }

  // Truncate if too long
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    description = description.slice(0, DESCRIPTION_MAX_LENGTH - 3) + '...';
  }

  // Generate unique source_id - include parent area for sub-places to avoid collisions
  const sourceId = entry.parentArea
    ? `swimmingholes-${slugify(entry.parentArea, entry.state)}-${slugify(entry.name, '')}`
    : `swimmingholes-${slugify(entry.name, entry.state)}`;

  // Generate slug - include parent area suffix for sub-places
  const slug = entry.parentArea
    ? slugify(`${entry.name} ${entry.parentArea}`, entry.state)
    : slugify(entry.name, entry.state);

  return {
    name: entry.name,
    slug,
    state: entry.state,
    location: `POINT(${entry.lng} ${entry.lat})`,
    spring_type: springType,
    experience_type: experienceType,
    description,
    fee_type: determineFeeType(entry.fee || ''),
    clothing_optional: determineClothingOptional(entry.bathingSuits || ''),
    confidence: mapConfidence(entry.confidence || ''),
    source: 'swimmingholes',
    source_id: sourceId,
    enrichment_status: 'pending',
  };
}

async function fetchStatePage(stateCode: string): Promise<string> {
  const url = `https://www.swimmingholes.org/${stateCode.toLowerCase()}.html`;

  // Fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SoakMapBot/1.0)',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return ''; // No page for this state
      }
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.text();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out for ${url}`);
    }
    throw err;
  }
}

async function insertSprings(springs: ReturnType<typeof transformToSpring>[], dryRun: boolean) {
  if (dryRun) {
    log.info(`[DRY RUN] Would insert ${springs.length} springs`);
    if (springs.length > 0) {
      log.info('Sample:', springs.slice(0, 2));
    }
    return { inserted: 0, errors: 0, skipped: 0 };
  }

  let inserted = 0;
  let errors = 0;
  let skipped = 0;
  const batches = chunk(springs, config.batch.insert);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    log.progress(i + 1, batches.length, `Inserting batch ${i + 1}/${batches.length}`);

    const { error, count } = await supabase.from('springs').upsert(batch, {
      onConflict: 'slug',
      ignoreDuplicates: true,
      count: 'exact',
    });

    if (error) {
      log.error(`Batch ${i + 1} failed: ${error.message}`);
      // Try inserting individually to isolate failures
      for (const spring of batch) {
        const { error: singleError } = await supabase.from('springs').upsert(spring, {
          onConflict: 'slug',
          ignoreDuplicates: true,
        });
        if (singleError) {
          log.error(`Failed to insert "${spring.name}": ${singleError.message}`);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      const actualInserted = count || batch.length;
      inserted += actualInserted;
      skipped += batch.length - actualInserted;
    }
  }

  if (skipped > 0) {
    log.info(`Skipped ${skipped} duplicates`);
  }

  return { inserted, errors, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limitArg = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined;
  const stateIdx = args.indexOf('--state');
  const singleState = stateIdx >= 0 ? args[stateIdx + 1]?.toUpperCase() : undefined;

  // Validate limit argument
  if (limitArg !== undefined && (isNaN(limitArg) || limitArg <= 0)) {
    log.error('--limit must be a positive integer');
    process.exit(1);
  }
  const limit = limitArg;

  log.info('Starting swimmingholes.org scrape');
  if (dryRun) log.warn('DRY RUN MODE - no data will be inserted');
  if (singleState) log.info(`Single state mode: ${singleState}`);
  if (limit) log.info(`Limiting to ${limit} total records`);

  const statesToProcess = singleState ? [singleState] : STATES;
  const allSprings: ReturnType<typeof transformToSpring>[] = [];

  for (let i = 0; i < statesToProcess.length; i++) {
    const state = statesToProcess[i];
    log.progress(i + 1, statesToProcess.length, `Fetching ${state}`);

    try {
      const html = await fetchStatePage(state);
      if (!html) {
        log.debug(`No page for ${state}`);
        continue;
      }

      const entries = parseStateHtml(html, state);
      log.info(`${state}: found ${entries.length} entries`);

      const springs = entries.map(transformToSpring);
      allSprings.push(...springs);

      if (limit && allSprings.length >= limit) {
        log.info(`Reached limit of ${limit}`);
        break;
      }

      // Rate limiting
      await sleep(config.rateLimit.swimmingholes);
    } catch (err) {
      log.error(`Error fetching ${state}: ${err}`);
    }
  }

  if (allSprings.length === 0) {
    log.warn('No springs found');
    return;
  }

  // Dedupe by slug (local dedup)
  const uniqueSprings = Array.from(
    new Map(allSprings.map((s) => [s.slug, s])).values()
  );
  log.info(`Total unique springs: ${uniqueSprings.length}`);

  // Pre-insert deduplication - check against existing database
  log.info('Checking for duplicates against existing database...');
  const springsWithCoords = uniqueSprings.map((s) => {
    // Extract lat/lng from POINT string
    const match = s.location.match(/POINT\((-?\d+\.?\d*) (-?\d+\.?\d*)\)/);
    return {
      ...s,
      lat: match ? parseFloat(match[2]) : 0,
      lng: match ? parseFloat(match[1]) : 0,
    };
  });

  const { new: newSprings, duplicates } = await filterNewSprings(springsWithCoords);
  log.info(`Found ${newSprings.length} new springs, ${duplicates.length} duplicates`);

  if (duplicates.length > 0) {
    log.info('Skipping duplicates:');
    for (const dupe of duplicates.slice(0, 5)) {
      log.info(`  - "${dupe.spring.name}" (matches existing)`);
    }
    if (duplicates.length > 5) {
      log.info(`  ... and ${duplicates.length - 5} more`);
    }
  }

  // Apply limit if specified
  const springsToInsert = limit ? newSprings.slice(0, limit) : newSprings;

  // Insert into database
  log.info('Inserting into database...');
  const { inserted, errors } = await insertSprings(springsToInsert, dryRun);

  // Clear cache after insert
  clearSpringCache();

  log.done(`Scraped ${inserted} springs (${errors} errors, ${duplicates.length} duplicates skipped)`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
