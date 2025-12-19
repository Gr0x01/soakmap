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

import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { slugify, chunk, sleep, getSpringTypeFromTemp, cleanText } from './lib/utils';
import { config } from './lib/config';

const log = createLogger('SwimmingHoles');

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
}

/**
 * Parse coordinates from LAT,LON field
 * Format: "lat=32.95169, lon=-116.30582(source:UScampgrounds) (accuracy: exact)"
 */
function parseCoords(text: string): { lat: number | null; lng: number | null } {
  const latMatch = text.match(/lat=(-?\d+\.?\d*)/);
  const lonMatch = text.match(/lon=(-?\d+\.?\d*)/);

  return {
    lat: latMatch ? parseFloat(latMatch[1]) : null,
    lng: lonMatch ? parseFloat(lonMatch[1]) : null,
  };
}

/**
 * Extract entries from HTML
 */
function parseStateHtml(html: string, stateCode: string): RawEntry[] {
  const entries: RawEntry[] = [];

  // Split by entry headers (h3 with red font)
  // Each entry starts with <h3><font color="#ff0000">NAME</font></h3>
  const entryPattern = /<h3><font color="#ff0000">[\s\S]*?<br>\s*([\s\S]*?)<br><\/font><\/h3>/gi;
  const entryMatches = [...html.matchAll(entryPattern)];

  // Alternative: split by <hr> and process each section
  const sections = html.split('<hr>');

  for (const section of sections) {
    // Look for entry name
    const nameMatch = section.match(/<h3><font color="#ff0000">[\s\S]*?<br>\s*([\s\S]*?)<br><\/font><\/h3>/i);
    if (!nameMatch) continue;

    const name = cleanText(nameMatch[1].replace(/<[^>]*>/g, ''));
    if (!name || name.length < 2) continue;

    // Parse table rows
    const entry: Partial<RawEntry> = { name, state: stateCode };

    // Extract field values from table rows
    const rowPattern = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
    const rows = [...section.matchAll(rowPattern)];

    for (const row of rows) {
      const field = cleanText(row[1].replace(/<[^>]*>/g, '').toUpperCase());
      const value = cleanText(row[2].replace(/<[^>]*>/g, ''));

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
          break;
      }
    }

    // Only include if we have required fields
    if (entry.name && entry.lat && entry.lng) {
      entries.push(entry as RawEntry);
    }
  }

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
  const sanctionLower = sanction?.toLowerCase() || '';
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
  if (description.length > 1500) {
    description = description.slice(0, 1497) + '...';
  }

  return {
    name: entry.name,
    slug: slugify(entry.name, entry.state),
    state: entry.state,
    location: `POINT(${entry.lng} ${entry.lat})`,
    spring_type: springType,
    experience_type: experienceType,
    description,
    fee_type: determineFeeType(entry.fee || ''),
    clothing_optional: determineClothingOptional(entry.bathingSuits || ''),
    confidence: mapConfidence(entry.confidence || ''),
    source: 'swimmingholes',
    source_id: `swimmingholes-${slugify(entry.name, entry.state)}`,
    enrichment_status: 'pending',
  };
}

async function fetchStatePage(stateCode: string): Promise<string> {
  const url = `https://www.swimmingholes.org/${stateCode.toLowerCase()}.html`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SoakMap/1.0 (https://soakmap.com; building natural springs directory)',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return ''; // No page for this state
    }
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function insertSprings(springs: ReturnType<typeof transformToSpring>[], dryRun: boolean) {
  if (dryRun) {
    log.info(`[DRY RUN] Would insert ${springs.length} springs`);
    if (springs.length > 0) {
      log.info('Sample:', springs.slice(0, 2));
    }
    return { inserted: 0, errors: 0 };
  }

  let inserted = 0;
  let errors = 0;
  const batches = chunk(springs, config.batch.insert);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    log.progress(i + 1, batches.length, `Inserting batch ${i + 1}/${batches.length}`);

    const { error } = await supabase.from('springs').upsert(batch, {
      onConflict: 'slug',
      ignoreDuplicates: true,
    });

    if (error) {
      log.error(`Batch ${i + 1} error: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined;
  const stateIdx = args.indexOf('--state');
  const singleState = stateIdx >= 0 ? args[stateIdx + 1]?.toUpperCase() : undefined;

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

  // Dedupe by slug
  const uniqueSprings = Array.from(
    new Map(allSprings.map((s) => [s.slug, s])).values()
  );
  log.info(`Total unique springs: ${uniqueSprings.length}`);

  // Apply limit if specified
  const springsToInsert = limit ? uniqueSprings.slice(0, limit) : uniqueSprings;

  // Insert into database
  log.info('Inserting into database...');
  const { inserted, errors } = await insertSprings(springsToInsert, dryRun);

  log.done(`Scraped ${inserted} springs (${errors} errors)`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
