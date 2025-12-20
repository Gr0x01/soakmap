#!/usr/bin/env npx tsx
/**
 * Scrape hot springs from soakoregon.com
 *
 * Usage:
 *   npx tsx scripts/06-scrape-soakoregon.ts [--dry-run] [--limit N]
 *
 * The script:
 * 1. Fetches sitemap to get all hot spring page URLs
 * 2. Scrapes each page for coordinates, temperature, access info, etc.
 * 3. Transforms to our schema with pre-insert deduplication
 * 4. Inserts into Supabase
 */

import * as cheerio from 'cheerio';
import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { slugify, chunk, sleep } from './lib/utils';
import { config } from './lib/config';
import { filterNewSprings, clearSpringCache } from './lib/dedup';

const log = createLogger('SoakOregon');

// Constants
const SITEMAP_URL = 'https://soakoregon.com/sitemap-1.xml';
const FETCH_TIMEOUT_MS = 30000;
const DESCRIPTION_MAX_LENGTH = 1500;

interface SpringData {
  name: string;
  url: string;
  lat: number | null;
  lng: number | null;
  tempF: number | null;
  description: string;
  accessInfo: string;
  feeInfo: string;
  facilities: string;
  isCommercial: boolean;
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
 * Parse sitemap XML to extract hot spring page URLs
 */
function parseSitemap(xml: string): string[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const urls: string[] = [];

  $('url > loc').each((_, el) => {
    const url = $(el).text().trim();
    // Filter for hot spring pages (contain "hot-springs", "warm-spring", or specific patterns)
    if (
      url.includes('hot-springs') ||
      url.includes('warm-spring') ||
      url.includes('lithia-springs') ||
      url.includes('wellsprings') ||
      url.includes('geyser')
    ) {
      urls.push(url);
    }
  });

  return urls;
}

/**
 * Extract spring name from URL
 */
function extractNameFromUrl(url: string): string {
  const match = url.match(/soakoregon\.com\/([^/]+)\/?$/);
  if (!match) return '';

  return match[1]
    .replace(/-/g, ' ')
    .replace(/\b(in oregon|cabins|resort)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parse coordinates from page content
 * Looks for patterns like "44.936, -122.173" or "GPS: 44.936 122.173"
 * Note: soakoregon.com often omits the minus sign on longitude
 */
function parseCoordinates(text: string, html: string): { lat: number; lng: number } | null {
  // Try Google Maps embed first (most reliable)
  const mapsMatch = html.match(/google\.com\/maps\/embed\?pb=[^"]*!2d(-?\d+\.\d+)!3d(\d+\.\d+)/);
  if (mapsMatch) {
    const lng = parseFloat(mapsMatch[1]);
    const lat = parseFloat(mapsMatch[2]);
    if (lat >= 41 && lat <= 47 && lng >= -125 && lng <= -116) {
      return { lat, lng };
    }
  }

  // Pattern: GPS coordinates - note longitude may be missing minus sign
  const gpsPatterns = [
    /GPS[:\s]*(\d{2}\.\d{2,6})\s*[,\s]\s*(-?\d{2,3}\.\d{2,6})/i,
    /GPS[:\s]*(\d{2}\.\d{2,6})\s+(\d{2,3}\.\d{2,6})/i, // Space separated, no minus
    /coordinates[:\s]*(\d{2}\.\d{2,6})\s*[,\s]\s*(-?\d{2,3}\.\d{2,6})/i,
  ];

  for (const pattern of gpsPatterns) {
    const match = text.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      let lng = parseFloat(match[2]);

      // Oregon longitudes are always negative (western hemisphere)
      // If longitude is positive and in range 117-125, make it negative
      if (lng > 0 && lng >= 116 && lng <= 125) {
        lng = -lng;
      }

      // Validate Oregon bounds (roughly 42-46 lat, -124 to -117 lng)
      if (lat >= 41 && lat <= 47 && lng >= -125 && lng <= -116) {
        return { lat, lng };
      }
    }
  }

  // Fallback: look for any coordinate-like pair
  const fallbackMatch = text.match(/(\d{2}\.\d{2,6})\s*[,/\s]\s*(-?\d{2,3}\.\d{2,6})/);
  if (fallbackMatch) {
    const lat = parseFloat(fallbackMatch[1]);
    let lng = parseFloat(fallbackMatch[2]);
    if (lng > 0 && lng >= 116 && lng <= 125) {
      lng = -lng;
    }
    if (lat >= 41 && lat <= 47 && lng >= -125 && lng <= -116) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Parse temperature from page content
 */
function parseTemperature(text: string): number | null {
  // Look for source temperature or soaking temperature
  const patterns = [
    /source\s+temp(?:erature)?[:\s]*(\d+)\s*°?\s*F/i,
    /(\d+)\s*°?\s*F\s+(?:source|spring)/i,
    /temp(?:erature)?[:\s]*(\d+)\s*°?\s*F/i,
    /(\d{2,3})\s*°F/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      // Validate reasonable hot spring temperature range
      if (temp >= 70 && temp <= 212) {
        return temp;
      }
    }
  }

  return null;
}

/**
 * Scrape a single hot spring page
 */
async function scrapePage(url: string): Promise<SpringData | null> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // Extract name from title or h1
    let name = $('h1.entry-title, h1').first().text().trim();
    if (!name) {
      name = extractNameFromUrl(url);
    }
    // Clean up name
    name = name.replace(/\s+in\s+Oregon$/i, '').trim();

    // Get full page text and HTML for coordinate/temp extraction
    const bodyText = $('article, .entry-content, main').text();

    // Extract coordinates (pass both text and full HTML for Google Maps embed)
    const coords = parseCoordinates(bodyText, html);

    // Extract temperature
    const tempF = parseTemperature(bodyText);

    // Extract description from first few paragraphs
    const paragraphs: string[] = [];
    $('article p, .entry-content p').each((i, el) => {
      if (i < 4) {
        const text = $(el).text().trim();
        if (text.length > 30 && !text.includes('©') && !text.includes('cookie')) {
          paragraphs.push(text);
        }
      }
    });
    const description = paragraphs.join(' ').slice(0, DESCRIPTION_MAX_LENGTH);

    // Check for commercial indicators
    const isCommercial =
      bodyText.toLowerCase().includes('resort') ||
      bodyText.toLowerCase().includes('admission') ||
      bodyText.toLowerCase().includes('day pass') ||
      url.includes('resort');

    // Extract fee info
    let feeInfo = '';
    const feeMatch = bodyText.match(/(?:fee|cost|price|admission)[:\s]*\$?(\d+)/i);
    if (feeMatch) {
      feeInfo = `$${feeMatch[1]}`;
    } else if (bodyText.toLowerCase().includes('free')) {
      feeInfo = 'free';
    }

    // Extract access info
    let accessInfo = '';
    const hikeMatch = bodyText.match(/(\d+\.?\d*)\s*(?:-\s*)?mile\s+(?:hike|trail|walk)/i);
    if (hikeMatch) {
      accessInfo = `${hikeMatch[1]} mile hike`;
    } else if (bodyText.toLowerCase().includes('drive-up') || bodyText.toLowerCase().includes('roadside')) {
      accessInfo = 'drive-up';
    }

    // Extract facilities
    const facilities: string[] = [];
    if (bodyText.toLowerCase().includes('restroom') || bodyText.toLowerCase().includes('toilet')) {
      facilities.push('restrooms');
    }
    if (bodyText.toLowerCase().includes('camping') || bodyText.toLowerCase().includes('campground')) {
      facilities.push('camping');
    }
    if (bodyText.toLowerCase().includes('changing') || bodyText.toLowerCase().includes('bathhouse')) {
      facilities.push('changing rooms');
    }

    return {
      name,
      url,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      tempF,
      description,
      accessInfo,
      feeInfo,
      facilities: facilities.join(', '),
      isCommercial,
    };
  } catch (err) {
    log.error(`Failed to scrape ${url}: ${err}`);
    return null;
  }
}

/**
 * Determine spring type from temperature
 */
function determineSpringType(tempF: number | null): 'hot' | 'warm' | 'cold' {
  if (!tempF) return 'hot'; // Default for Oregon hot springs
  if (tempF >= 100) return 'hot';
  if (tempF >= 70) return 'warm';
  return 'cold';
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
function determineAccessDifficulty(
  accessInfo: string
): 'drive_up' | 'short_walk' | 'moderate_hike' | 'difficult_hike' {
  if (!accessInfo) return 'moderate_hike';

  const lower = accessInfo.toLowerCase();
  if (lower.includes('drive-up') || lower.includes('drive up')) return 'drive_up';

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
function determineFeeType(feeInfo: string, isCommercial: boolean): 'free' | 'paid' | 'donation' | 'unknown' {
  if (feeInfo.toLowerCase() === 'free') return 'free';
  if (feeInfo.includes('$') || isCommercial) return 'paid';
  return 'unknown';
}

function transformToSpring(data: SpringData) {
  const springType = determineSpringType(data.tempF);
  const experienceType = determineExperienceType(data.isCommercial);

  // Build description
  let description = data.description;
  if (!description || description.length < 20) {
    description = `${data.name} is a ${springType} spring in Oregon.`;
    if (data.isCommercial) description += ' This is a commercial facility.';
  }

  const slug = slugify(data.name, 'or');
  const sourceId = `soakoregon-${slug}`;

  return {
    name: data.name,
    slug,
    state: 'OR',
    location: `POINT(${data.lng} ${data.lat})`,
    lat: data.lat!,
    lng: data.lng!,
    spring_type: springType,
    experience_type: experienceType,
    access_difficulty: determineAccessDifficulty(data.accessInfo),
    temp_f: data.tempF,
    fee_type: determineFeeType(data.feeInfo, data.isCommercial),
    description,
    confidence: 'high' as const,
    source: 'soakoregon',
    source_id: sourceId,
    enrichment_status: 'pending',
  };
}

async function insertSprings(springs: ReturnType<typeof transformToSpring>[], dryRun: boolean) {
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

    // Remove lat/lng from insert (they're for dedup, location is the PostGIS field)
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

  log.info('Starting soakoregon.com scrape');
  if (dryRun) log.warn('DRY RUN MODE - no data will be inserted');
  if (limit) log.info(`Limiting to ${limit} records`);

  // Fetch and parse sitemap
  log.info('Fetching sitemap...');
  const sitemapXml = await fetchPage(SITEMAP_URL);
  const urls = parseSitemap(sitemapXml);
  log.info(`Found ${urls.length} hot spring pages in sitemap`);

  if (urls.length === 0) {
    log.warn('No hot spring URLs found');
    return;
  }

  // Scrape each page
  log.info('Scraping individual pages...');
  const springData: SpringData[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    log.progress(i + 1, urls.length, `Scraping ${extractNameFromUrl(url)}`);

    const data = await scrapePage(url);
    if (data && data.lat && data.lng) {
      springData.push(data);
    } else if (data) {
      log.debug(`No coordinates found for ${data.name}`);
    }

    // Rate limiting
    await sleep(config.rateLimit.soakoregon || 500);
  }

  log.info(`Scraped ${springData.length} springs with coordinates`);

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
