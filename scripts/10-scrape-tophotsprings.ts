#!/usr/bin/env npx tsx
/**
 * Scrape hot springs from tophotsprings.com
 *
 * Coverage: 25 US states with individual spring detail pages
 * GPS coordinates extracted from Google Maps embeds
 *
 * Usage:
 *   npx tsx scripts/10-scrape-tophotsprings.ts [--dry-run] [--limit N] [--state XX]
 */

import * as cheerio from 'cheerio';
import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { slugify, chunk, sleep } from './lib/utils';
import { config } from './lib/config';
import { filterNewSprings, clearSpringCache } from './lib/dedup';

const log = createLogger('TopHS');

const FETCH_TIMEOUT_MS = 30000;
const DESCRIPTION_MAX_LENGTH = 1500;
const BASE_URL = 'https://www.tophotsprings.com';

// State pages to scrape (excluding Colorado which redirects externally)
const STATE_PAGES: Record<string, string> = {
  AK: '/alaska-hot-springs/',
  AZ: '/arizona-hot-springs/',
  AR: '/arkansas-hot-springs/',
  CA: '/california-hot-springs/',
  FL: '/florida-hot-springs/',
  HI: '/hawaii-hot-springs/',
  ID: '/idaho-hot-springs/',
  IL: '/illinois-hot-springs/',
  MA: '/massachusetts-hot-springs/',
  MT: '/montana-hot-springs/',
  NV: '/nevada-hot-springs/',
  NM: '/new-mexico-hot-springs/',
  NY: '/new-york-hot-springs/',
  NC: '/north-carolina-hot-springs/',
  OR: '/oregon-hot-springs/',
  PA: '/pennsylvania-hot-springs/',
  SD: '/south-dakota-hot-springs/',
  TN: '/tennessee-hot-springs/',
  TX: '/texas-hot-springs/',
  UT: '/utah-hot-springs/',
  VA: '/virginia-hot-springs/',
  WA: '/washington-hot-springs/',
  WV: '/west-virginia-hot-springs/',
  WY: '/wyoming-hot-springs/',
};

// Approximate state bounds for coordinate validation
const STATE_BOUNDS: Record<string, { lat: [number, number]; lng: [number, number] }> = {
  AK: { lat: [51, 71], lng: [-180, -130] },
  AZ: { lat: [31, 37], lng: [-115, -109] },
  AR: { lat: [33, 36.5], lng: [-94.5, -89.5] },
  CA: { lat: [32, 42], lng: [-124.5, -114] },
  FL: { lat: [24, 31], lng: [-87.5, -80] },
  HI: { lat: [18, 23], lng: [-161, -154] },
  ID: { lat: [42, 49], lng: [-117, -111] },
  IL: { lat: [37, 42.5], lng: [-91.5, -87] },
  MA: { lat: [41, 43], lng: [-73.5, -69.5] },
  MT: { lat: [44, 49], lng: [-116, -104] },
  NV: { lat: [35, 42], lng: [-120, -114] },
  NM: { lat: [31.5, 37], lng: [-109, -103] },
  NY: { lat: [40, 45], lng: [-80, -71.5] },
  NC: { lat: [34, 36.5], lng: [-84.5, -75.5] },
  OR: { lat: [42, 46.5], lng: [-124.5, -116.5] },
  PA: { lat: [39.5, 42.5], lng: [-80.5, -75] },
  SD: { lat: [42.5, 46], lng: [-104.5, -96.5] },
  TN: { lat: [35, 36.7], lng: [-90, -81.5] },
  TX: { lat: [25.5, 36.5], lng: [-106.5, -93.5] },
  UT: { lat: [37, 42], lng: [-114, -109] },
  VA: { lat: [36.5, 39.5], lng: [-83.5, -75] },
  WA: { lat: [45.5, 49], lng: [-124.5, -116.5] },
  WV: { lat: [37, 40], lng: [-82.5, -77.5] },
  WY: { lat: [41, 45], lng: [-111, -104] },
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
  description: string;
  accessInfo: string;
  feeInfo: string;
  isResort: boolean;
  isClosed: boolean;
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
 * Parse state index page to get all spring URLs
 */
function parseStateIndex(html: string, state: string): SpringEntry[] {
  const $ = cheerio.load(html);
  const entries: SpringEntry[] = [];
  const seen = new Set<string>();

  // Find links to individual spring pages
  $('a[href*="tophotsprings.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // Skip state index pages, category pages, external links
    if (
      href.endsWith('-hot-springs/') ||
      href.includes('/category/') ||
      href.includes('/tag/') ||
      href.includes('/search/') ||
      !href.includes('tophotsprings.com')
    ) {
      return;
    }

    // Match individual spring URLs
    const match = href.match(/tophotsprings\.com\/([a-z0-9-]+)\/?$/i);
    if (!match) return;

    const slug = match[1];

    // Skip known non-spring pages
    if (
      slug === 'about' ||
      slug === 'contact' ||
      slug === 'privacy-policy' ||
      slug === 'united-states-hot-springs' ||
      slug.endsWith('-hot-springs') // State index pages
    ) {
      return;
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
      url: href.startsWith('http') ? href : `${BASE_URL}/${slug}/`,
      state,
    });
  });

  return entries;
}

/**
 * Parse coordinates from Google Maps embed
 */
function parseCoordinates(
  html: string,
  state: string
): { lat: number; lng: number } | null {
  const bounds = STATE_BOUNDS[state];
  if (!bounds) return null;

  // Pattern: google.com/maps/embed?pb=...!2d{lng}!3d{lat}...
  const mapsEmbedPattern = /google\.com\/maps\/embed\?pb=[^"]*!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/;
  const match = html.match(mapsEmbedPattern);
  if (match) {
    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);
    if (isValidCoord(lat, lng, bounds)) {
      return { lat, lng };
    }
  }

  // Fallback: look for maps URL with @lat,lng
  const mapsUrlPattern = /google\.com\/maps[^"]*@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const urlMatch = html.match(mapsUrlPattern);
  if (urlMatch) {
    const lat = parseFloat(urlMatch[1]);
    const lng = parseFloat(urlMatch[2]);
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
function parseTemperature(text: string): number | null {
  const patterns = [
    /(?:water\s+)?temp(?:erature)?[:\s]*(?:approximately\s+)?(\d+)\s*°?\s*F/i,
    /(\d+)\s*°?\s*F(?:ahrenheit)?/i,
    /(\d{2,3})\s*degrees?\s*F/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      if (temp >= 60 && temp <= 212) {
        return temp;
      }
    }
  }

  return null;
}

/**
 * Scrape an individual spring page
 */
async function scrapePage(entry: SpringEntry): Promise<SpringData | null> {
  try {
    const html = await fetchPage(entry.url);
    const $ = cheerio.load(html);

    // Get page text
    const bodyText = $('article, .entry-content, main').text();

    // Extract name from h1 or title
    let name = $('h1.entry-title, h1').first().text().trim();
    if (!name) name = entry.name;

    // Clean up name
    name = name
      .replace(/\s*[-–—]\s*[A-Z][^-–—]*$/, '') // Remove subtitle
      .replace(/\s*[-–—]\s*(Idaho|California|Oregon|Montana|Nevada|Utah|Wyoming|Washington|Arizona|New Mexico|Arkansas|Colorado).*$/i, '')
      .replace(/\s+Hot Springs?$/i, ' Hot Springs')
      .replace(/\s+Warm Springs?$/i, ' Warm Springs')
      .trim();

    // Check if closed
    const isClosed = bodyText.toLowerCase().includes('closed') &&
      (bodyText.toLowerCase().includes('permanently') ||
       name.toLowerCase().includes('closed'));

    // Extract coordinates from Google Maps embed
    const coords = parseCoordinates(html, entry.state);

    // Extract temperature
    const tempF = parseTemperature(bodyText);

    // Extract description from first paragraphs
    const paragraphs: string[] = [];
    $('article p, .entry-content p').each((i, el) => {
      if (i < 5) {
        const text = $(el).text().trim();
        if (
          text.length > 40 &&
          !text.includes('©') &&
          !text.includes('cookie') &&
          !text.includes('Privacy') &&
          !text.includes('advertisement')
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
      entry.url.includes('resort') ||
      entry.url.includes('inn') ||
      entry.url.includes('lodge');

    // Extract fee info
    let feeInfo = '';
    if (lowerText.includes('free') && (lowerText.includes('no fee') || lowerText.includes('no cost'))) {
      feeInfo = 'free';
    } else {
      const feeMatch = bodyText.match(/(?:fee|admission|cost)[:\s]*\$(\d+)/i);
      if (feeMatch) {
        feeInfo = `$${feeMatch[1]}`;
      }
    }

    // Extract access info
    let accessInfo = '';
    const hikeMatch = bodyText.match(/(\d+\.?\d*)\s*(?:[-–]?\s*)?mile\s*(?:hike|trail|trek|walk)/i);
    if (hikeMatch) {
      accessInfo = `${hikeMatch[1]} mile hike`;
    } else if (lowerText.includes('roadside') || lowerText.includes('pull-off') || lowerText.includes('drive-up')) {
      accessInfo = 'drive-up';
    }

    return {
      name,
      url: entry.url,
      state: entry.state,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      tempF,
      description,
      accessInfo,
      feeInfo,
      isResort,
      isClosed,
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
  if (lower.includes('drive') || lower.includes('roadside')) return 'drive_up';

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

function transformToSpring(data: SpringData) {
  const springType = determineSpringType(data.tempF);
  const experienceType = determineExperienceType(data.isResort);

  // Build description
  let description = data.description;
  if (!description || description.length < 30) {
    description = `${data.name} is a ${springType} spring in ${data.state}.`;
    if (data.isResort) description += ' This is a commercial facility.';
  }
  if (data.isClosed) {
    description = `[CLOSED] ${description}`;
  }

  const slug = slugify(data.name, data.state.toLowerCase());
  const sourceId = `tophotsprings-${slug}`;

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
    description: description.slice(0, DESCRIPTION_MAX_LENGTH),
    confidence: 'high' as const,
    source: 'tophotsprings',
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

  log.info('Starting tophotsprings.com scrape');
  if (dryRun) log.warn('DRY RUN MODE - no data will be inserted');
  if (limitArg) log.info(`Limiting to ${limitArg} records`);
  if (stateArg) log.info(`Filtering to state: ${stateArg}`);

  // Collect all spring entries from state pages
  const allEntries: SpringEntry[] = [];
  const statesToScrape = stateArg ? { [stateArg]: STATE_PAGES[stateArg] } : STATE_PAGES;

  for (const [state, path] of Object.entries(statesToScrape)) {
    log.info(`Fetching ${state} index page...`);
    try {
      const html = await fetchPage(`${BASE_URL}${path}`);
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
    log.progress(i + 1, allEntries.length, `Scraping ${entry.name.slice(0, 30)}`);

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
