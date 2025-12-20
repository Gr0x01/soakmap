#!/usr/bin/env npx tsx
/**
 * Fetch photos for springs from Wikimedia Commons (primary) and Tavily (fallback)
 *
 * Usage:
 *   npx tsx scripts/12-fetch-photos.ts [--dry-run] [--limit N] [--state XX]
 */

import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { sleep } from './lib/utils';
import { config } from './lib/config';

const log = createLogger('Photos');

const DEFAULT_CONCURRENCY = 50;
const WIKIMEDIA_DELAY_MS = 0; // No delay needed - requests are already rate limited by concurrency
const TAVILY_DELAY_MS = 0;

interface Spring {
  id: string;
  name: string;
  state: string;
  spring_type: string;
}

interface WikimediaResult {
  title: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
}

/**
 * Search Wikimedia Commons for images
 */
async function searchWikimedia(springName: string, state: string): Promise<string | null> {
  const queries = [
    `${springName} ${state}`,
    `${springName} hot spring`,
    `${springName}`,
  ];

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrnamespace: '6', // File namespace
        gsrsearch: query,
        gsrlimit: '5',
        prop: 'imageinfo',
        iiprop: 'url|size|mime',
        iiurlwidth: '800', // Get a reasonably sized thumbnail
        origin: '*',
      });

      const response = await fetch(
        `https://commons.wikimedia.org/w/api.php?${params}`,
        {
          headers: {
            'User-Agent': 'SoakMap/1.0 (https://soakmap.com; contact@soakmap.com)',
          },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const pages = data.query?.pages;
      if (!pages) continue;

      // Filter for actual photos (not maps, diagrams, etc.)
      for (const page of Object.values(pages) as any[]) {
        const imageInfo = page.imageinfo?.[0];
        if (!imageInfo) continue;

        const mime = imageInfo.mime || '';
        const title = (page.title || '').toLowerCase();

        // Skip non-photos
        if (!mime.startsWith('image/')) continue;
        if (mime === 'image/svg+xml') continue;
        if (title.includes('map') || title.includes('logo') || title.includes('icon')) continue;
        if (title.includes('diagram') || title.includes('chart')) continue;

        // Prefer landscape photos
        const width = imageInfo.width || 0;
        const height = imageInfo.height || 0;
        if (width < 400 || height < 300) continue;

        // Return the thumbnail URL (800px wide)
        const thumbUrl = imageInfo.thumburl || imageInfo.url;
        if (thumbUrl) {
          return thumbUrl;
        }
      }
    } catch (err) {
      // Continue to next query
    }

    await sleep(WIKIMEDIA_DELAY_MS);
  }

  return null;
}

/**
 * Search Tavily for images as fallback
 */
async function searchTavilyImages(springName: string, state: string): Promise<string | null> {
  if (!config.tavily.apiKey) return null;

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.tavily.apiKey,
        query: `${springName} ${state} hot spring photo`,
        search_depth: 'basic',
        include_images: true,
        max_results: 5,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const images = data.images as string[] | undefined;

    if (images && images.length > 0) {
      // Filter out obvious non-photos
      for (const url of images) {
        const lower = url.toLowerCase();
        if (lower.includes('logo') || lower.includes('icon')) continue;
        if (lower.includes('map') || lower.includes('diagram')) continue;
        if (lower.endsWith('.svg') || lower.endsWith('.gif')) continue;

        // Basic URL validation
        if (url.startsWith('http') && (lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.webp'))) {
          return url;
        }
      }

      // If no filtered match, return first image
      return images[0];
    }
  } catch (err) {
    // Fallback failed
  }

  return null;
}

/**
 * Fetch photo for a single spring
 */
async function fetchPhoto(spring: Spring): Promise<{ id: string; photoUrl: string | null; source: string | null }> {
  // Wikimedia only - Tavily returns random unrelated images
  const photoUrl = await searchWikimedia(spring.name, spring.state);
  const source = photoUrl ? 'wikimedia' : null;

  return { id: spring.id, photoUrl, source };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 100;
  const stateIdx = args.indexOf('--state');
  const stateFilter = stateIdx >= 0 ? args[stateIdx + 1]?.toUpperCase() : undefined;
  const concurrencyIdx = args.indexOf('--concurrency');
  const concurrency = concurrencyIdx >= 0 ? parseInt(args[concurrencyIdx + 1], 10) : DEFAULT_CONCURRENCY;

  log.info('Starting photo fetch');
  log.info(`Limit: ${limit}, Concurrency: ${concurrency}`);
  if (dryRun) log.warn('DRY RUN MODE - no data will be updated');
  if (stateFilter) log.info(`Filtering by state: ${stateFilter}`);

  // Fetch springs without photos
  let query = supabase
    .from('springs')
    .select('id, name, state, spring_type')
    .is('photo_url', null)
    .limit(limit);

  if (stateFilter) {
    query = query.eq('state', stateFilter);
  }

  const { data: springs, error } = await query;

  if (error) {
    log.error('Failed to fetch springs', error);
    process.exit(1);
  }

  if (!springs || springs.length === 0) {
    log.info('No springs without photos found');
    return;
  }

  log.info(`Found ${springs.length} springs without photos`);

  let found = 0;
  let notFound = 0;
  let wikimediaCount = 0;
  let tavilyCount = 0;

  // Process in batches
  for (let i = 0; i < springs.length; i += concurrency) {
    const chunk = springs.slice(i, i + concurrency);
    log.info(`Processing ${i + 1}-${i + chunk.length} of ${springs.length}...`);

    const results = await Promise.all(chunk.map(fetchPhoto));

    for (const result of results) {
      if (result.photoUrl) {
        found++;
        if (result.source === 'wikimedia') wikimediaCount++;
        if (result.source === 'tavily') tavilyCount++;

        if (dryRun) {
          const spring = chunk.find(s => s.id === result.id);
          log.info(`[DRY RUN] ${spring?.name}: ${result.source} - ${result.photoUrl.slice(0, 60)}...`);
        } else {
          const { error: updateError } = await supabase
            .from('springs')
            .update({
              photo_url: result.photoUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', result.id);

          if (updateError) {
            log.error(`Failed to update photo for ${result.id}`);
          }
        }
      } else {
        notFound++;
      }
    }

    log.info(`Progress: ${found} found, ${notFound} not found`);

  }

  log.done(`Finished: ${found} photos found (${wikimediaCount} Wikimedia, ${tavilyCount} Tavily), ${notFound} not found`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
