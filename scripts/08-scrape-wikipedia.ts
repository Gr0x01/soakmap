#!/usr/bin/env npx tsx
/**
 * Scrape hot springs from Wikipedia's List of hot springs in the United States
 * Source: https://en.wikipedia.org/wiki/List_of_hot_springs_in_the_United_States
 *
 * This script:
 * 1. Parses the list page to extract spring names and states
 * 2. Uses Tavily API to search for coordinates for each spring
 * 3. Deduplicates against existing database entries
 * 4. Inserts new springs
 *
 * Usage:
 *   npx tsx scripts/08-scrape-wikipedia.ts [--dry-run] [--limit N]
 */

import * as cheerio from 'cheerio';
import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { slugify, chunk, sleep } from './lib/utils';
import { config } from './lib/config';
import { filterNewSprings, clearSpringCache } from './lib/dedup';

const log = createLogger('Wikipedia');

// Constants
const LIST_URL = 'https://en.wikipedia.org/wiki/List_of_hot_springs_in_the_United_States';
const FETCH_TIMEOUT_MS = 30000;

// State name to abbreviation mapping
const STATE_ABBREV: Record<string, string> = {
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Massachusetts': 'MA',
  'Montana': 'MT',
  'Nevada': 'NV',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wyoming': 'WY',
};

interface WikiSpring {
  name: string;
  state: string;
  stateAbbrev: string;
  articleTitle: string;
}

interface EnrichedSpring extends WikiSpring {
  lat: number;
  lng: number;
  description: string;
}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
}

interface TavilyResponse {
  results?: TavilyResult[];
  answer?: string;
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
 * Parse the Wikipedia list page to extract springs organized by state
 */
function parseListPage(html: string): WikiSpring[] {
  const $ = cheerio.load(html);
  const springs: WikiSpring[] = [];
  let currentState = '';
  let currentAbbrev = '';

  // Only process content within the main article content area
  // This avoids picking up navigation/sidebar lists
  const $content = $('#mw-content-text .mw-parser-output');

  // Wikipedia wraps h2 in div.mw-heading, so we need to find those containers
  // Structure: <div class="mw-heading"><h2 id="Alaska">Alaska</h2>...</div> followed by <ul>
  $content.find('h2').each((_, h2El) => {
    const $h2 = $(h2El);
    const headerId = $h2.attr('id') || '';

    if (STATE_ABBREV[headerId]) {
      currentState = headerId;
      currentAbbrev = STATE_ABBREV[headerId];

      // The h2 is inside a div.mw-heading, we need to get the parent div's siblings
      const $headingDiv = $h2.closest('.mw-heading');
      let $next = $headingDiv.length ? $headingDiv.next() : $h2.next();

      // Skip any figures/images between header and list
      while ($next.length && ($next.is('figure') || $next.is('span'))) {
        $next = $next.next();
      }

      // Process ul lists until we hit another heading or non-list element
      while ($next.length && $next.is('ul')) {
        $next.find('> li').each((_, li) => {
          const $li = $(li);
          const $link = $li.find('a').first();

          if ($link.length) {
            const href = $link.attr('href') || '';
            // Skip non-wiki links, category links, and red links (non-existent pages)
            if (!href.startsWith('/wiki/') || href.includes(':') || href.includes('#')) return;
            // Skip red links (action=edit means page doesn't exist)
            if (href.includes('action=edit')) return;

            const articleTitle = href.replace('/wiki/', '').replace(/_/g, ' ');
            let name = $link.text().trim();
            name = name.replace(/\s*\([^)]*\)\s*$/, '').trim();

            if (!name || name.length < 3) return;
            if (name.toLowerCase().includes('list of')) return;

            springs.push({
              name,
              state: currentState,
              stateAbbrev: currentAbbrev,
              articleTitle,
            });
          }
        });
        $next = $next.next();
      }
    }
  });

  return springs;
}

/**
 * Fetch and parse a Wikipedia article for rich spring data
 * Extracts: coordinates, description, history, and other details from infobox
 */
async function fetchWikipediaArticle(
  articleTitle: string,
  springName: string,
  state: string
): Promise<{
  lat: number;
  lng: number;
  description: string;
  temperature?: string;
  elevation?: string;
} | null> {
  const encodedTitle = encodeURIComponent(articleTitle.replace(/ /g, '_'));
  const url = `https://en.wikipedia.org/wiki/${encodedTitle}`;

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // Extract coordinates from the page
    // Wikipedia often has coords in geo microformat or in the infobox
    let lat: number | null = null;
    let lng: number | null = null;

    // Try geo microformat (span.geo)
    const $geo = $('.geo').first();
    if ($geo.length) {
      const geoText = $geo.text();
      const parts = geoText.split(';').map((s) => s.trim());
      if (parts.length === 2) {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }
    }

    // Try latitude/longitude spans
    if (!lat || !lng) {
      const $lat = $('.latitude').first();
      const $lng = $('.longitude').first();
      if ($lat.length && $lng.length) {
        lat = parseDMS($lat.text());
        lng = parseDMS($lng.text());
      }
    }

    // Try infobox coordinates
    if (!lat || !lng) {
      const infoboxText = $('.infobox').text();
      const coordMatch = infoboxText.match(
        /(\d{1,3})°(\d{1,2})′(\d{1,2}(?:\.\d+)?)″([NS])\s*(\d{1,3})°(\d{1,2})′(\d{1,2}(?:\.\d+)?)″([EW])/
      );
      if (coordMatch) {
        lat = dmsToDecimal(
          parseInt(coordMatch[1]),
          parseInt(coordMatch[2]),
          parseFloat(coordMatch[3]),
          coordMatch[4]
        );
        lng = dmsToDecimal(
          parseInt(coordMatch[5]),
          parseInt(coordMatch[6]),
          parseFloat(coordMatch[7]),
          coordMatch[8]
        );
      }
    }

    // Validate coordinates for US
    if (lat && lng) {
      if (lat < 24 || lat > 72 || lng < -180 || lng > -66) {
        lat = null;
        lng = null;
      }
    }

    if (!lat || !lng) {
      return null;
    }

    // Extract description from first paragraphs
    const paragraphs: string[] = [];
    $('#mw-content-text .mw-parser-output > p').each((i, el) => {
      if (i < 3) {
        const text = $(el).text().trim();
        // Skip empty, citation-only, or very short paragraphs
        if (text.length > 50 && !text.startsWith('[')) {
          paragraphs.push(text);
        }
      }
    });

    let description = paragraphs.join(' ').slice(0, 1500);
    // Clean up citation markers like [1], [2]
    description = description.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();

    if (!description) {
      description = `${springName} is a hot spring located in ${state}.`;
    }

    // Try to extract temperature from infobox or text
    let temperature: string | undefined;
    const tempMatch = $('#mw-content-text').text().match(/(\d{2,3})\s*°?\s*[Ff]/);
    if (tempMatch) {
      temperature = `${tempMatch[1]}°F`;
    }

    // Try to extract elevation
    let elevation: string | undefined;
    const elevMatch = $('#mw-content-text').text().match(/elevation[:\s]+(\d{1,2},?\d{3})\s*(?:ft|feet|m)/i);
    if (elevMatch) {
      elevation = elevMatch[1].replace(',', '');
    }

    return { lat, lng, description, temperature, elevation };
  } catch (err) {
    log.debug(`Failed to fetch Wikipedia article ${articleTitle}: ${err}`);
    return null;
  }
}

/**
 * Parse DMS string like "65°3′10″N" to decimal
 */
function parseDMS(dmsStr: string): number | null {
  const match = dmsStr.match(/(\d+)°(\d+)′(\d+(?:\.\d+)?)″([NSEW])/);
  if (!match) return null;

  const deg = parseInt(match[1]);
  const min = parseInt(match[2]);
  const sec = parseFloat(match[3]);
  const dir = match[4];

  return dmsToDecimal(deg, min, sec, dir);
}

/**
 * Convert DMS to decimal degrees
 */
function dmsToDecimal(deg: number, min: number, sec: number, dir: string): number {
  let decimal = deg + min / 60 + sec / 3600;
  if (dir === 'S' || dir === 'W') decimal = -decimal;
  return decimal;
}

/**
 * Search Tavily for spring coordinates (fallback when Wikipedia article doesn't have coords)
 */
async function searchSpringCoordinates(
  name: string,
  state: string
): Promise<{ lat: number; lng: number; description: string } | null> {
  if (!config.tavily.apiKey) {
    log.warn('No Tavily API key configured');
    return null;
  }

  const query = `"${name}" ${state} hot spring GPS coordinates latitude longitude`;

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.tavily.apiKey,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      log.error(`Tavily error for ${name}: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as TavilyResponse;

    // Try to extract coordinates from results
    const allText = [
      data.answer || '',
      ...(data.results || []).map((r) => `${r.title || ''} ${r.content || ''}`),
    ].join(' ');

    const coords = extractCoordinates(allText);
    if (!coords) return null;

    // Build description from snippets
    const description = buildDescription(name, state, data.results || []);

    return { ...coords, description };
  } catch (err) {
    log.error(`Tavily search failed for ${name}: ${err}`);
    return null;
  }
}

/**
 * Extract coordinates from text using various patterns
 */
function extractCoordinates(text: string): { lat: number; lng: number } | null {
  // Pattern 1: Decimal degrees (e.g., 65.0528, -146.0553)
  const decimalPattern = /(-?\d{1,3}\.\d{3,7})[°,\s]+(-?\d{1,3}\.\d{3,7})/g;
  const matches = [...text.matchAll(decimalPattern)];

  for (const match of matches) {
    const first = parseFloat(match[1]);
    const second = parseFloat(match[2]);

    // Determine which is lat and which is lng based on US coordinates
    // US lat: ~24-72, US lng: ~-180 to -66
    let lat: number, lng: number;

    if (first > 0 && first < 75 && second < 0 && second > -180) {
      lat = first;
      lng = second;
    } else if (second > 0 && second < 75 && first < 0 && first > -180) {
      lat = second;
      lng = first;
    } else {
      continue;
    }

    // Validate US bounds
    if (lat >= 24 && lat <= 72 && lng >= -180 && lng <= -66) {
      return { lat, lng };
    }
  }

  // Pattern 2: DMS format (e.g., 65°3'10"N 146°3'19"W)
  const dmsPattern = /(\d{1,3})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)[″"]\s*([NS])\s*(\d{1,3})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)[″"]\s*([EW])/gi;
  const dmsMatch = dmsPattern.exec(text);

  if (dmsMatch) {
    const latDeg = parseInt(dmsMatch[1]);
    const latMin = parseInt(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3]);
    const latDir = dmsMatch[4].toUpperCase();

    const lngDeg = parseInt(dmsMatch[5]);
    const lngMin = parseInt(dmsMatch[6]);
    const lngSec = parseFloat(dmsMatch[7]);
    const lngDir = dmsMatch[8].toUpperCase();

    let lat = latDeg + latMin / 60 + latSec / 3600;
    let lng = lngDeg + lngMin / 60 + lngSec / 3600;

    if (latDir === 'S') lat = -lat;
    if (lngDir === 'W') lng = -lng;

    if (lat >= 24 && lat <= 72 && lng >= -180 && lng <= -66) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Build description from search results
 */
function buildDescription(name: string, state: string, results: TavilyResult[]): string {
  // Get the most relevant snippet
  const snippets = results
    .filter((r) => r.content && r.content.length > 50)
    .map((r) => r.content!)
    .slice(0, 2);

  if (snippets.length > 0) {
    // Take first 300 chars of first snippet
    let desc = snippets[0].slice(0, 300);
    if (snippets[0].length > 300) desc += '...';
    return desc;
  }

  return `${name} is a hot spring in ${state}. Data sourced from Wikipedia.`;
}

/**
 * Transform to our schema
 */
function transformToSpring(spring: EnrichedSpring) {
  const slug = slugify(spring.name, spring.stateAbbrev.toLowerCase());
  const sourceId = `wikipedia-${spring.stateAbbrev.toLowerCase()}-${slug}`;

  return {
    name: spring.name,
    slug,
    state: spring.stateAbbrev,
    location: `POINT(${spring.lng} ${spring.lat})`,
    lat: spring.lat,
    lng: spring.lng,
    spring_type: 'hot' as const,
    experience_type: 'primitive' as const, // Default, will be enriched later
    description: spring.description,
    confidence: 'medium' as const,
    source: 'wikipedia',
    source_id: sourceId,
    enrichment_status: 'pending',
  };
}

/**
 * Insert springs into database
 */
async function insertSprings(springs: ReturnType<typeof transformToSpring>[], dryRun: boolean) {
  if (dryRun) {
    log.info(`[DRY RUN] Would insert ${springs.length} springs`);
    if (springs.length > 0) {
      log.info('Sample:', springs.slice(0, 3));
    }
    return { inserted: 0, errors: 0 };
  }

  let inserted = 0;
  let errors = 0;
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
      inserted += count || batch.length;
    }
  }

  return { inserted, errors };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limitArg = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined;

  if (limitArg !== undefined && (isNaN(limitArg) || limitArg <= 0)) {
    log.error('--limit must be a positive integer');
    process.exit(1);
  }
  const limit = limitArg;

  log.info('Starting Wikipedia hot springs scrape');
  if (dryRun) log.warn('DRY RUN MODE - no data will be inserted');
  if (limit) log.info(`Limiting to ${limit} records`);

  // Fetch and parse list page
  log.info('Fetching Wikipedia list page...');
  const html = await fetchPage(LIST_URL);
  const springs = parseListPage(html);
  log.info(`Found ${springs.length} spring entries`);

  // Show state distribution
  const stateCounts = new Map<string, number>();
  for (const spring of springs) {
    stateCounts.set(spring.stateAbbrev, (stateCounts.get(spring.stateAbbrev) || 0) + 1);
  }
  const topStates = [...stateCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  log.info(`Top states: ${topStates.map(([s, c]) => `${s}(${c})`).join(', ')}`);

  // Fetch Wikipedia articles directly for rich content
  log.info('Fetching Wikipedia articles for coordinates and descriptions...');
  const enrichedSprings: EnrichedSpring[] = [];
  const springsToSearch = limit ? springs.slice(0, limit * 2) : springs; // Search more to account for failures
  let wikiSuccesses = 0;
  let tavilySuccesses = 0;

  for (let i = 0; i < springsToSearch.length; i++) {
    const spring = springsToSearch[i];

    if (limit && enrichedSprings.length >= limit) break;

    log.progress(i + 1, springsToSearch.length, `Fetching ${spring.name}`);

    // First try fetching the Wikipedia article directly
    let result = await fetchWikipediaArticle(spring.articleTitle, spring.name, spring.state);

    if (result) {
      wikiSuccesses++;
      enrichedSprings.push({
        ...spring,
        lat: result.lat,
        lng: result.lng,
        description: result.description,
      });
      log.debug(`[Wiki] Found ${spring.name}: ${result.lat}, ${result.lng}`);
    } else {
      // Fall back to Tavily search
      const tavilyResult = await searchSpringCoordinates(spring.name, spring.state);
      if (tavilyResult) {
        tavilySuccesses++;
        enrichedSprings.push({
          ...spring,
          lat: tavilyResult.lat,
          lng: tavilyResult.lng,
          description: tavilyResult.description,
        });
        log.debug(`[Tavily] Found ${spring.name}: ${tavilyResult.lat}, ${tavilyResult.lng}`);
      } else {
        log.debug(`No coords found for ${spring.name}`);
      }
    }

    // Rate limiting (be nice to Wikipedia)
    await sleep(300);
  }

  log.info(`Sources: ${wikiSuccesses} from Wikipedia, ${tavilySuccesses} from Tavily`)

  log.info(`Found coordinates for ${enrichedSprings.length} springs`);

  if (enrichedSprings.length === 0) {
    log.warn('No springs with coordinates found');
    return;
  }

  // Transform to our schema
  const transformedSprings = enrichedSprings.map(transformToSpring);

  // Pre-insert deduplication
  log.info('Checking for duplicates against existing database...');
  const { new: newSprings, duplicates } = await filterNewSprings(transformedSprings);
  log.info(`Found ${newSprings.length} new springs, ${duplicates.length} duplicates`);

  if (duplicates.length > 0) {
    log.info('Skipping duplicates:');
    for (const dupe of duplicates.slice(0, 5)) {
      log.info(`  - "${dupe.spring.name}" (${dupe.spring.state})`);
    }
    if (duplicates.length > 5) {
      log.info(`  ... and ${duplicates.length - 5} more`);
    }
  }

  // Insert into database
  log.info('Inserting into database...');
  const { inserted, errors } = await insertSprings(newSprings, dryRun);

  // Clear cache after insert
  clearSpringCache();

  log.done(`Imported ${inserted} springs (${errors} errors, ${duplicates.length} duplicates skipped)`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
