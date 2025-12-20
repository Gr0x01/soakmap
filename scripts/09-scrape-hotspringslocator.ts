#!/usr/bin/env npx tsx
/**
 * Scrape hot springs from hotspringslocator.com
 *
 * Coverage: California, Idaho, Montana, Nevada, Oregon, Washington
 * (~226 springs with GPS coordinates, temperatures, water chemistry)
 *
 * Usage:
 *   npx tsx scripts/09-scrape-hotspringslocator.ts [--dry-run] [--limit N] [--state XX]
 */

import * as cheerio from 'cheerio';
import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { slugify, chunk, sleep } from './lib/utils';
import { config } from './lib/config';
import { filterNewSprings, clearSpringCache } from './lib/dedup';

const log = createLogger('HSLocator');

const FETCH_TIMEOUT_MS = 30000;
const DESCRIPTION_MAX_LENGTH = 1500;

// State pages to scrape
const STATE_PAGES: Record<string, string> = {
  CA: 'https://hotspringslocator.com/california-hot-springs/',
  ID: 'https://hotspringslocator.com/idaho-hot-springs/',
  MT: 'https://hotspringslocator.com/montana-hot-springs/',
  NV: 'https://hotspringslocator.com/nevada-hot-springs/',
  OR: 'https://hotspringslocator.com/oregon-hot-springs/',
  WA: 'https://hotspringslocator.com/washington-hot-springs/',
};

// State bounds for coordinate validation
const STATE_BOUNDS: Record<string, { lat: [number, number]; lng: [number, number] }> = {
  CA: { lat: [32, 42], lng: [-124.5, -114] },
  ID: { lat: [42, 49], lng: [-117, -111] },
  MT: { lat: [44, 49], lng: [-116, -104] },
  NV: { lat: [35, 42], lng: [-120, -114] },
  OR: { lat: [42, 46.5], lng: [-124.5, -116.5] },
  WA: { lat: [45.5, 49], lng: [-124.5, -116.5] },
};

interface SpringEntry {
  name: string;
  url: string;
  state: string;
}

interface SpringData {
  name: string;
  url: string;
  state: string;
  lat: number | null;
  lng: number | null;
  tempF: number | null;
  tempC: number | null;
  elevation: number | null;
  description: string;
  waterChemistry: string;
  ph: number | null;
  flowRate: string;
  accessInfo: string;
  feeInfo: string;
  clothingOptional: boolean | null;
  isResort: boolean;
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

// Non-spring page slugs to skip
const SKIP_SLUGS = new Set([
  'about',
  'about-us',
  'contact',
  'contact-us',
  'privacy-policy',
  'disclaimer',
  'balneotherapy',
  'hot-springs-benefits',
  'hot-springs-risks',
  'mineral-hot-spring-types',
  'red-spider-mites-in-hot-springs',
]);

// State suffixes that indicate the spring is from that state
const STATE_SUFFIXES: Record<string, string> = {
  california: 'CA',
  idaho: 'ID',
  montana: 'MT',
  nevada: 'NV',
  oregon: 'OR',
  washington: 'WA',
  'british-columbia': 'BC',
  england: 'UK',
  greece: 'GR',
  hungary: 'HU',
  vietnam: 'VN',
};

/**
 * Parse state index page to get all spring URLs
 */
function parseStateIndex(html: string, state: string): SpringEntry[] {
  const $ = cheerio.load(html);
  const entries: SpringEntry[] = [];
  const seen = new Set<string>();

  // Look for links to individual spring pages
  $('a[href*="hotspringslocator.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // Skip index pages, category pages, tag pages
    if (
      (href.includes('-hot-springs/') && href.endsWith('-hot-springs/')) ||
      href.includes('/category/') ||
      href.includes('/tag/') ||
      href.includes('/page/')
    ) {
      return;
    }

    // Match individual spring URLs
    const match = href.match(/hotspringslocator\.com\/([a-z0-9-]+)\/?$/i);
    if (!match) return;

    const slug = match[1];

    // Skip known non-spring pages
    if (SKIP_SLUGS.has(slug) || slug.endsWith('-hot-springs')) {
      return;
    }

    // Skip pages about hot springs in other countries (England, Greece, etc.)
    for (const [suffix, code] of Object.entries(STATE_SUFFIXES)) {
      if (slug.includes(suffix) && code !== state && !['CA', 'ID', 'MT', 'NV', 'OR', 'WA'].includes(code)) {
        return; // Skip international springs
      }
    }

    if (seen.has(slug)) return;
    seen.add(slug);

    // Extract name from link text
    let name = $(el).text().trim();
    if (!name || name.length < 3) {
      name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    entries.push({
      name,
      url: href.startsWith('http') ? href : `https://hotspringslocator.com/${slug}/`,
      state,
    });
  });

  return entries;
}

/**
 * Parse coordinates from page content
 */
function parseCoordinates(
  text: string,
  html: string,
  state: string
): { lat: number; lng: number } | null {
  const bounds = STATE_BOUNDS[state];
  if (!bounds) return null;

  // Pattern 1: "GPS Coordinates: N 38°14.355' W 119°19.533'"
  const dmsPattern = /GPS[:\s]*N\s*(\d+)°(\d+\.?\d*)['′]?\s*W\s*(\d+)°(\d+\.?\d*)['′]?/i;
  const dmsMatch = text.match(dmsPattern);
  if (dmsMatch) {
    const lat = parseFloat(dmsMatch[1]) + parseFloat(dmsMatch[2]) / 60;
    const lng = -(parseFloat(dmsMatch[3]) + parseFloat(dmsMatch[4]) / 60);
    if (isValidCoord(lat, lng, bounds)) {
      return { lat, lng };
    }
  }

  // Pattern 2: Decimal degrees in parentheses "(38.239250, -119.325550)"
  const decimalParenPattern = /\((\d{2,3}\.\d{3,6}),?\s*(-?\d{2,3}\.\d{3,6})\)/;
  const decimalParenMatch = text.match(decimalParenPattern);
  if (decimalParenMatch) {
    const lat = parseFloat(decimalParenMatch[1]);
    let lng = parseFloat(decimalParenMatch[2]);
    if (lng > 0) lng = -lng; // Western hemisphere
    if (isValidCoord(lat, lng, bounds)) {
      return { lat, lng };
    }
  }

  // Pattern 3: "Latitude: 44.2448° N" and "Longitude: 114.8861° W"
  const latMatch = text.match(/Latitude[:\s]*(\d{2}\.\d{3,6})°?\s*N/i);
  const lngMatch = text.match(/Longitude[:\s]*(\d{2,3}\.\d{3,6})°?\s*W/i);
  if (latMatch && lngMatch) {
    const lat = parseFloat(latMatch[1]);
    const lng = -parseFloat(lngMatch[1]);
    if (isValidCoord(lat, lng, bounds)) {
      return { lat, lng };
    }
  }

  // Pattern 4: Google Maps embed
  const mapsMatch = html.match(/google\.com\/maps[^"]*[@!](-?\d+\.\d+)[,!](-?\d+\.\d+)/);
  if (mapsMatch) {
    let lat = parseFloat(mapsMatch[1]);
    let lng = parseFloat(mapsMatch[2]);
    // Maps can have lat,lng or lng,lat order - validate both
    if (isValidCoord(lat, lng, bounds)) {
      return { lat, lng };
    }
    if (isValidCoord(lng, lat, bounds)) {
      return { lat: lng, lng: lat };
    }
  }

  // Pattern 5: Simple decimal "44.2448, -114.8861"
  const simpleDecimal = /(\d{2}\.\d{3,6})\s*[,°]\s*(-?\d{2,3}\.\d{3,6})/g;
  const matches = [...text.matchAll(simpleDecimal)];
  for (const match of matches) {
    const lat = parseFloat(match[1]);
    let lng = parseFloat(match[2]);
    if (lng > 0 && lng > 100) lng = -lng;
    if (isValidCoord(lat, lng, bounds)) {
      return { lat, lng };
    }
  }

  return null;
}

function isValidCoord(
  lat: number,
  lng: number,
  bounds: { lat: [number, number]; lng: [number, number] }
): boolean {
  return (
    lat >= bounds.lat[0] &&
    lat <= bounds.lat[1] &&
    lng >= bounds.lng[0] &&
    lng <= bounds.lng[1]
  );
}

/**
 * Parse temperature from page content
 */
function parseTemperature(text: string): { tempF: number | null; tempC: number | null } {
  // Look for source/pool temperature
  const patterns = [
    /(?:source|spring|pool)[^.]*?(\d+)\s*°?\s*F\s*\((\d+)\s*°?\s*C\)/i,
    /(\d+)\s*°?\s*F\s*\((\d+)\s*°?\s*C\)/,
    /temperature[:\s]*(\d+)\s*°?\s*F/i,
    /(\d{2,3})\s*°\s*F(?:ahrenheit)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const tempF = parseInt(match[1], 10);
      const tempC = match[2] ? parseInt(match[2], 10) : Math.round((tempF - 32) * 5 / 9);
      if (tempF >= 60 && tempF <= 212) {
        return { tempF, tempC };
      }
    }
  }

  return { tempF: null, tempC: null };
}

/**
 * Parse water chemistry info
 */
function parseWaterChemistry(text: string): { chemistry: string; ph: number | null } {
  let chemistry = '';
  let ph: number | null = null;

  // pH
  const phMatch = text.match(/pH[:\s]*(\d+\.?\d*)/i);
  if (phMatch) {
    ph = parseFloat(phMatch[1]);
    if (ph < 0 || ph > 14) ph = null;
  }

  // Water type
  const typeMatch = text.match(/(?:water\s+)?type[:\s]*([A-Za-z\s]+(?:Bicarbonate|Sulfate|Chloride|Carbonate)[A-Za-z\s]*)/i);
  if (typeMatch) {
    chemistry = typeMatch[1].trim();
  }

  return { chemistry, ph };
}

/**
 * Scrape an individual spring page
 */
async function scrapePage(entry: SpringEntry): Promise<SpringData | null> {
  try {
    const html = await fetchPage(entry.url);
    const $ = cheerio.load(html);

    // Get page text
    const bodyText = $('article, .entry-content, main, body').text();

    // Extract name from h1 or entry
    let name = $('h1.entry-title, h1').first().text().trim();
    if (!name) name = entry.name;

    // Clean up name - remove long subtitles after dash/colon
    name = name
      .replace(/\s*[:\|]\s*[A-Z].*$/i, '') // Remove subtitle after colon or pipe
      .replace(/\s*[-–—]\s*[A-Z][^-–—]*$/i, '') // Remove subtitle after dash
      .replace(/\s*[-–—]\s*(California|Idaho|Montana|Nevada|Oregon|Washington|Northern|Eastern|Southern).*$/i, '')
      .replace(/\s+Hot Springs?$/i, ' Hot Springs')
      .replace(/\s+Warm Springs?$/i, ' Warm Springs')
      .trim();

    // If name still too long, truncate at reasonable point
    if (name.length > 50) {
      const dashIdx = name.indexOf(' – ');
      const colonIdx = name.indexOf(': ');
      const pipeIdx = name.indexOf(' | ');
      const cutIdx = [dashIdx, colonIdx, pipeIdx].filter(i => i > 10).sort((a, b) => a - b)[0];
      if (cutIdx) name = name.slice(0, cutIdx).trim();
    }

    // Detect actual state from URL or page title (some pages are cross-listed)
    let actualState = entry.state;
    const stateInUrl = entry.url.toLowerCase();
    const stateInTitle = name.toLowerCase();
    for (const [suffix, code] of Object.entries(STATE_SUFFIXES)) {
      if ((stateInUrl.includes(suffix) || stateInTitle.includes(suffix)) && ['CA', 'ID', 'MT', 'NV', 'OR', 'WA'].includes(code)) {
        actualState = code;
        break;
      }
    }

    // Extract coordinates using the actual state bounds
    const coords = parseCoordinates(bodyText, html, actualState);

    // Extract temperature
    const { tempF, tempC } = parseTemperature(bodyText);

    // Extract water chemistry
    const { chemistry, ph } = parseWaterChemistry(bodyText);

    // Extract elevation
    let elevation: number | null = null;
    const elevMatch = bodyText.match(/elevation[:\s]*(\d{1,2},?\d{3})\s*(?:ft|feet)/i);
    if (elevMatch) {
      elevation = parseInt(elevMatch[1].replace(',', ''), 10);
    }

    // Extract flow rate
    let flowRate = '';
    const flowMatch = bodyText.match(/flow\s*rate[:\s]*(\d+)\s*(?:liters?|L|gal)/i);
    if (flowMatch) {
      flowRate = `${flowMatch[1]} L/min`;
    }

    // Extract description from first paragraphs
    const paragraphs: string[] = [];
    $('article p, .entry-content p').each((i, el) => {
      if (i < 5) {
        const text = $(el).text().trim();
        if (
          text.length > 40 &&
          !text.includes('©') &&
          !text.includes('cookie') &&
          !text.includes('Privacy')
        ) {
          paragraphs.push(text);
        }
      }
    });
    const description = paragraphs.join(' ').slice(0, DESCRIPTION_MAX_LENGTH);

    // Detect resort/commercial
    const lowerText = bodyText.toLowerCase();
    const isResort =
      lowerText.includes('resort') ||
      lowerText.includes('admission') ||
      lowerText.includes('day pass') ||
      lowerText.includes('spa hotel') ||
      entry.url.includes('resort');

    // Detect clothing optional
    let clothingOptional: boolean | null = null;
    if (lowerText.includes('clothing optional') || lowerText.includes('nude') || lowerText.includes('naturist')) {
      clothingOptional = true;
    } else if (lowerText.includes('swimsuit required') || lowerText.includes('bathing suits required')) {
      clothingOptional = false;
    }

    // Extract fee info
    let feeInfo = '';
    if (lowerText.includes('free') && (lowerText.includes('no fee') || lowerText.includes('day-use'))) {
      feeInfo = 'free';
    } else {
      const feeMatch = bodyText.match(/(?:fee|admission|cost)[:\s]*\$(\d+)/i);
      if (feeMatch) {
        feeInfo = `$${feeMatch[1]}`;
      }
    }

    // Extract access info
    let accessInfo = '';
    const hikeMatch = bodyText.match(/(\d+\.?\d*)\s*(?:mile|mi)\s*(?:hike|trail|walk)/i);
    if (hikeMatch) {
      accessInfo = `${hikeMatch[1]} mile hike`;
    } else if (lowerText.includes('roadside') || lowerText.includes('pull-off')) {
      accessInfo = 'roadside';
    } else if (lowerText.includes('short walk') || lowerText.includes('easy walk')) {
      accessInfo = 'short walk';
    }

    return {
      name,
      url: entry.url,
      state: actualState,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      tempF,
      tempC,
      elevation,
      description,
      waterChemistry: chemistry,
      ph,
      flowRate,
      accessInfo,
      feeInfo,
      clothingOptional,
      isResort,
    };
  } catch (err) {
    log.error(`Failed to scrape ${entry.url}: ${err}`);
    return null;
  }
}

/**
 * Determine spring type from temperature
 */
function determineSpringType(tempF: number | null): 'hot' | 'warm' | 'cold' {
  if (!tempF) return 'hot';
  if (tempF >= 100) return 'hot';
  if (tempF >= 70) return 'warm';
  return 'cold';
}

/**
 * Determine experience type
 */
function determineExperienceType(isResort: boolean): 'resort' | 'primitive' | 'hybrid' {
  return isResort ? 'resort' : 'primitive';
}

/**
 * Determine access difficulty
 */
function determineAccessDifficulty(
  accessInfo: string
): 'drive_up' | 'short_walk' | 'moderate_hike' | 'difficult_hike' {
  if (!accessInfo) return 'moderate_hike';

  const lower = accessInfo.toLowerCase();
  if (lower.includes('roadside') || lower.includes('drive')) return 'drive_up';
  if (lower.includes('short walk') || lower.includes('easy')) return 'short_walk';

  const milesMatch = accessInfo.match(/(\d+\.?\d*)\s*mile/);
  if (milesMatch) {
    const miles = parseFloat(milesMatch[1]);
    if (miles < 0.5) return 'short_walk';
    if (miles < 2) return 'moderate_hike';
    return 'difficult_hike';
  }

  return 'moderate_hike';
}

/**
 * Determine fee type
 */
function determineFeeType(
  feeInfo: string,
  isResort: boolean
): 'free' | 'paid' | 'donation' | 'unknown' {
  if (feeInfo.toLowerCase() === 'free') return 'free';
  if (feeInfo.includes('$') || isResort) return 'paid';
  return 'unknown';
}

/**
 * Determine clothing optional status
 */
function determineClothingOptional(
  clothingOptional: boolean | null
): 'yes' | 'no' | 'unofficial' | 'unknown' {
  if (clothingOptional === true) return 'yes';
  if (clothingOptional === false) return 'no';
  return 'unknown';
}

function transformToSpring(data: SpringData) {
  const springType = determineSpringType(data.tempF);
  const experienceType = determineExperienceType(data.isResort);

  // Build description
  let description = data.description;
  if (!description || description.length < 30) {
    description = `${data.name} is a ${springType} spring in ${data.state}.`;
    if (data.isResort) description += ' This is a commercial facility.';
  }

  // Add water chemistry to description if available
  if (data.waterChemistry && !description.includes(data.waterChemistry)) {
    description += ` Water type: ${data.waterChemistry}.`;
  }

  const slug = slugify(data.name, data.state.toLowerCase());
  const sourceId = `hslocator-${slug}`;

  return {
    name: data.name,
    slug,
    state: data.state,
    location: `POINT(${data.lng} ${data.lat})`,
    lat: data.lat!,
    lng: data.lng!,
    spring_type: springType,
    experience_type: experienceType,
    access_difficulty: determineAccessDifficulty(data.accessInfo),
    temp_f: data.tempF,
    fee_type: determineFeeType(data.feeInfo, data.isResort),
    clothing_optional: determineClothingOptional(data.clothingOptional),
    description: description.slice(0, DESCRIPTION_MAX_LENGTH),
    confidence: 'high' as const,
    source: 'hotspringslocator',
    source_id: sourceId,
    enrichment_status: 'pending',
  };
}

async function insertSprings(
  springs: ReturnType<typeof transformToSpring>[],
  dryRun: boolean
) {
  if (dryRun) {
    log.info(`[DRY RUN] Would insert ${springs.length} springs`);
    if (springs.length > 0) {
      log.info('Sample:', JSON.stringify(springs.slice(0, 2), null, 2));
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

    // Remove lat/lng from insert (location is the PostGIS field)
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
  const stateIdx = args.indexOf('--state');
  const stateArg = stateIdx >= 0 ? args[stateIdx + 1]?.toUpperCase() : undefined;

  // Validate limit
  if (limitArg !== undefined && (isNaN(limitArg) || limitArg <= 0)) {
    log.error('--limit must be a positive integer');
    process.exit(1);
  }

  // Validate state
  if (stateArg && !STATE_PAGES[stateArg]) {
    log.error(`Invalid state: ${stateArg}. Valid: ${Object.keys(STATE_PAGES).join(', ')}`);
    process.exit(1);
  }

  log.info('Starting hotspringslocator.com scrape');
  if (dryRun) log.warn('DRY RUN MODE - no data will be inserted');
  if (limitArg) log.info(`Limiting to ${limitArg} records`);
  if (stateArg) log.info(`Filtering to state: ${stateArg}`);

  // Collect all spring entries from state pages
  const allEntries: SpringEntry[] = [];
  const statesToScrape = stateArg ? { [stateArg]: STATE_PAGES[stateArg] } : STATE_PAGES;

  for (const [state, url] of Object.entries(statesToScrape)) {
    log.info(`Fetching ${state} index page...`);
    try {
      const html = await fetchPage(url);
      const entries = parseStateIndex(html, state);
      log.info(`  Found ${entries.length} springs in ${state}`);
      allEntries.push(...entries);
      await sleep(500);
    } catch (err) {
      log.error(`Failed to fetch ${state}: ${err}`);
    }
  }

  log.info(`Total: ${allEntries.length} spring pages to scrape`);

  if (allEntries.length === 0) {
    log.warn('No spring entries found');
    return;
  }

  // Scrape individual pages
  log.info('Scraping individual pages...');
  const springData: SpringData[] = [];

  for (let i = 0; i < allEntries.length; i++) {
    const entry = allEntries[i];
    log.progress(i + 1, allEntries.length, `Scraping ${entry.name}`);

    const data = await scrapePage(entry);
    if (data && data.lat && data.lng) {
      springData.push(data);
    } else if (data) {
      log.debug(`No coordinates found for ${data.name}`);
    }

    await sleep(config.rateLimit.soakoregon || 500);
  }

  log.info(`Scraped ${springData.length} springs with coordinates`);

  // Show state breakdown
  const stateCounts = new Map<string, number>();
  for (const s of springData) {
    stateCounts.set(s.state, (stateCounts.get(s.state) || 0) + 1);
  }
  log.info(`By state: ${[...stateCounts.entries()].map(([s, c]) => `${s}(${c})`).join(', ')}`);

  if (springData.length === 0) {
    log.warn('No springs with coordinates found');
    return;
  }

  // Transform to our schema
  const springs = springData.map(transformToSpring);

  // Pre-insert deduplication
  log.info('Checking for duplicates against existing database...');
  const { new: newSprings, duplicates } = await filterNewSprings(springs);
  log.info(`Found ${newSprings.length} new springs, ${duplicates.length} duplicates`);

  if (duplicates.length > 0) {
    log.info('Skipping duplicates:');
    for (const dupe of duplicates.slice(0, 10)) {
      log.info(`  - "${dupe.spring.name}" (${dupe.spring.state})`);
    }
    if (duplicates.length > 10) {
      log.info(`  ... and ${duplicates.length - 10} more`);
    }
  }

  // Apply limit
  const springsToInsert = limitArg ? newSprings.slice(0, limitArg) : newSprings;

  // Insert into database
  log.info('Inserting into database...');
  const { inserted, errors } = await insertSprings(springsToInsert, dryRun);

  // Clear cache
  clearSpringCache();

  log.done(`Imported ${inserted} springs (${errors} errors, ${duplicates.length} duplicates skipped)`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
