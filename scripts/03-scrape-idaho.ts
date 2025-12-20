#!/usr/bin/env npx tsx
/**
 * Scrape hot springs from idahohotsprings.com
 *
 * Usage:
 *   npx tsx scripts/03-scrape-idaho.ts [--dry-run] [--limit N]
 *
 * The script:
 * 1. Fetches the main Idaho hot springs directory
 * 2. For each spring with a detail page, fetches coordinates from Google Maps embed
 * 3. Transforms to our schema with pre-insert deduplication
 * 4. Inserts into Supabase
 */

import * as cheerio from 'cheerio';
import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { slugify, chunk, sleep } from './lib/utils';
import { config } from './lib/config';
import { filterNewSprings, clearSpringCache } from './lib/dedup';

const log = createLogger('IdahoHS');

// Constants
const BASE_URL = 'https://www.idahohotsprings.com';
const DIRECTORY_URL = `${BASE_URL}/hot_springs/idaho_hot_springs.htm`;
const FETCH_TIMEOUT_MS = 30000;
const DESCRIPTION_MAX_LENGTH = 1500;

interface RawEntry {
  name: string;
  detailUrl: string | null;
  area: string;
  isCommercial: boolean;
  isClosed: boolean;
}

interface EnrichedEntry extends RawEntry {
  lat: number | null;
  lng: number | null;
  description: string;
  temperature: string;
  access: string;
  elevation: string;
}

/**
 * Fetch a page with timeout
 */
async function fetchPage(url: string): Promise<string> {
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

/**
 * Parse the main directory page to get all hot spring entries
 */
function parseDirectory(html: string): RawEntry[] {
  const entries: RawEntry[] = [];
  const $ = cheerio.load(html);
  let currentArea = '';

  // The page uses h4 headers for areas and ul/li for springs
  $('h4, li').each((_, el) => {
    const elem = $(el);

    if (el.tagName === 'h4') {
      // Extract area name (e.g., "Grangeville Area:")
      currentArea = elem.text().replace(/:$/, '').trim();
      return;
    }

    // li element - this is a hot spring entry
    const text = elem.text().trim();
    if (!text || text.length < 3) return;

    // Check for link to detail page
    const link = elem.find('a').first();
    const href = link.attr('href');

    // Parse name and flags
    const name = link.length ? link.text().trim() : text.split(/[(\[]/)[0].trim();
    if (!name || name.length < 2) return;

    const isCommercial = text.toLowerCase().includes('commercial');
    const isClosed = text.toLowerCase().includes('closed') || text.toLowerCase().includes('gone');

    // Build full URL if relative
    let detailUrl: string | null = null;
    if (href && href.includes('destinations')) {
      detailUrl = href.startsWith('http') ? href : `${BASE_URL}${href.replace('..', '')}`;
    }

    entries.push({
      name: cleanName(name),
      detailUrl,
      area: currentArea,
      isCommercial,
      isClosed,
    });
  });

  return entries;
}

/**
 * Clean up spring name
 */
function cleanName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parentheticals
    .replace(/\s*\[[^\]]*\]\s*/g, ' ') // Remove brackets
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract coordinates from Google Maps embed URL
 */
function extractCoordsFromMapsUrl(url: string): { lat: number; lng: number } | null {
  // Pattern: ll=LAT,LNG or q=LAT,LNG
  const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) {
    return {
      lat: parseFloat(llMatch[1]),
      lng: parseFloat(llMatch[2]),
    };
  }

  const qMatch = url.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    return {
      lat: parseFloat(qMatch[1]),
      lng: parseFloat(qMatch[2]),
    };
  }

  // Alternative format: @LAT,LNG
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    return {
      lat: parseFloat(atMatch[1]),
      lng: parseFloat(atMatch[2]),
    };
  }

  return null;
}

/**
 * Fetch detail page and extract data
 */
async function fetchDetailPage(url: string): Promise<Partial<EnrichedEntry>> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const data: Partial<EnrichedEntry> = {};

    // Extract coordinates from Google Maps iframe/link
    const mapsUrls: string[] = [];
    $('iframe[src*="maps.google"], a[href*="maps.google"], iframe[src*="google.com/maps"], a[href*="google.com/maps"]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('href') || '';
      mapsUrls.push(src);
    });

    for (const url of mapsUrls) {
      const coords = extractCoordsFromMapsUrl(url);
      if (coords) {
        data.lat = coords.lat;
        data.lng = coords.lng;
        break;
      }
    }

    // Extract description - usually in first few paragraphs
    const paragraphs: string[] = [];
    $('p').each((i, el) => {
      if (i < 5) {
        const text = $(el).text().trim();
        // Skip ads, scripts, and short text
        if (text.length > 20 &&
            !text.includes('ADVERTISEMENT') &&
            !text.includes('adsbygoogle') &&
            !text.includes('window.') &&
            !text.includes('googletag')) {
          paragraphs.push(text);
        }
      }
    });
    data.description = paragraphs.slice(0, 2).join(' ').slice(0, DESCRIPTION_MAX_LENGTH);

    // Try to find temperature info
    const fullText = $('body').text();
    const tempMatch = fullText.match(/(\d{2,3})\s*°?\s*[Ff]/);
    if (tempMatch) {
      data.temperature = `${tempMatch[1]}°F`;
    }

    // Try to find elevation
    const elevMatch = fullText.match(/elevation[:\s]+(\d[,\d]*)\s*(?:ft|feet)/i);
    if (elevMatch) {
      data.elevation = elevMatch[1].replace(',', '');
    }

    // Try to find access info
    const accessPatterns = [
      /(\d+\.?\d*)\s*mile[s]?\s*hike/i,
      /(short|easy|moderate|difficult|strenuous)\s*hike/i,
      /drive[- ]?up/i,
    ];
    for (const pattern of accessPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        data.access = match[0];
        break;
      }
    }

    return data;
  } catch (err) {
    log.error(`Failed to fetch detail page ${url}: ${err}`);
    return {};
  }
}

/**
 * Determine spring type - Idaho springs are almost all hot
 */
function determineSpringType(temp: string): 'hot' | 'warm' | 'cold' {
  if (!temp) return 'hot'; // Default for Idaho

  const match = temp.match(/(\d+)/);
  if (match) {
    const tempF = parseInt(match[1], 10);
    if (tempF >= 100) return 'hot';
    if (tempF >= 70) return 'warm';
    return 'cold';
  }

  return 'hot';
}

/**
 * Determine experience type
 */
function determineExperienceType(isCommercial: boolean): 'resort' | 'primitive' | 'hybrid' {
  return isCommercial ? 'resort' : 'primitive';
}

/**
 * Determine access difficulty
 */
function determineAccessDifficulty(access: string | undefined): 'drive_up' | 'short_walk' | 'moderate_hike' | 'difficult_hike' {
  if (!access) return 'moderate_hike'; // Default for Idaho backcountry

  const lower = access.toLowerCase();

  if (lower.includes('drive-up') || lower.includes('drive up')) return 'drive_up';
  if (lower.includes('easy') || lower.includes('short') || lower.match(/0\.\d+\s*mile/)) return 'short_walk';
  if (lower.includes('difficult') || lower.includes('strenuous') || lower.match(/[3-9]\+?\s*mile/)) return 'difficult_hike';
  return 'moderate_hike';
}

function transformToSpring(entry: EnrichedEntry) {
  const springType = determineSpringType(entry.temperature);
  const experienceType = determineExperienceType(entry.isCommercial);

  // Build description
  let description = entry.description || '';
  if (!description || description.length < 20) {
    description = `${entry.name} is a ${springType} spring in the ${entry.area} of Idaho.`;
    if (entry.isCommercial) description += ' This is a commercial facility.';
  }

  // Generate source_id and slug
  const sourceId = `idahohs-${slugify(entry.name, 'id')}`;
  const slug = slugify(entry.name, 'id');

  return {
    name: entry.name,
    slug,
    state: 'ID',
    location: `POINT(${entry.lng} ${entry.lat})`,
    lat: entry.lat!,
    lng: entry.lng!,
    spring_type: springType,
    experience_type: experienceType,
    access_difficulty: determineAccessDifficulty(entry.access),
    description,
    confidence: 'medium' as const,
    source: 'idahohotsprings',
    source_id: sourceId,
    enrichment_status: 'pending',
  };
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

    // Remove lat/lng from insert (they're for dedup, not direct insert)
    const batchForInsert = batch.map(({ lat, lng, ...rest }) => rest);

    const { error, count } = await supabase.from('springs').upsert(batchForInsert, {
      onConflict: 'slug',
      ignoreDuplicates: true,
      count: 'exact',
    });

    if (error) {
      log.error(`Batch ${i + 1} failed: ${error.message}`);
      for (const spring of batchForInsert) {
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

  return { inserted, errors, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limitArg = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined;

  // Validate limit argument
  if (limitArg !== undefined && (isNaN(limitArg) || limitArg <= 0)) {
    log.error('--limit must be a positive integer');
    process.exit(1);
  }
  const limit = limitArg;

  log.info('Starting idahohotsprings.com scrape');
  if (dryRun) log.warn('DRY RUN MODE - no data will be inserted');
  if (limit) log.info(`Limiting to ${limit} records`);

  // Fetch and parse directory
  log.info('Fetching directory...');
  const directoryHtml = await fetchPage(DIRECTORY_URL);
  const entries = parseDirectory(directoryHtml);
  log.info(`Found ${entries.length} entries in directory`);

  // Filter out closed springs
  const activeEntries = entries.filter((e) => !e.isClosed);
  log.info(`${activeEntries.length} active springs (${entries.length - activeEntries.length} closed/gone)`);

  // Fetch detail pages for springs with URLs
  log.info('Fetching detail pages for coordinates...');
  const enrichedEntries: EnrichedEntry[] = [];

  const entriesWithUrls = activeEntries.filter((e) => e.detailUrl);
  const entriesWithoutUrls = activeEntries.filter((e) => !e.detailUrl);

  log.info(`${entriesWithUrls.length} springs have detail pages, ${entriesWithoutUrls.length} do not`);

  for (let i = 0; i < entriesWithUrls.length; i++) {
    const entry = entriesWithUrls[i];
    log.progress(i + 1, entriesWithUrls.length, `Fetching ${entry.name}`);

    const details = await fetchDetailPage(entry.detailUrl!);

    if (details.lat && details.lng) {
      enrichedEntries.push({
        ...entry,
        lat: details.lat,
        lng: details.lng,
        description: details.description || '',
        temperature: details.temperature || '',
        access: details.access || '',
        elevation: details.elevation || '',
      });
    } else {
      log.debug(`No coordinates found for ${entry.name}`);
    }

    // Rate limiting
    await sleep(config.rateLimit.idaho || 500);
  }

  log.info(`Enriched ${enrichedEntries.length} springs with coordinates`);

  if (enrichedEntries.length === 0) {
    log.warn('No springs with coordinates found');
    return;
  }

  // Transform to our schema
  const springs = enrichedEntries.map(transformToSpring);

  // Pre-insert deduplication
  log.info('Checking for duplicates against existing database...');
  const { new: newSprings, duplicates } = await filterNewSprings(springs);
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

  // Apply limit
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
