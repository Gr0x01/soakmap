#!/usr/bin/env npx tsx
/**
 * Import hot springs from PANGAEA NOAA dataset
 * Source: https://doi.pangaea.de/10.1594/PANGAEA.981233
 *
 * This dataset contains 1,661 hot springs from NOAA's 1980-1981 compilation.
 * Data includes: name, state, lat/lng, temperature (°F and °C)
 *
 * Usage:
 *   npx tsx scripts/07-import-pangaea.ts [--dry-run] [--limit N]
 */

import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { slugify, chunk } from './lib/utils';
import { config } from './lib/config';
import { filterNewSprings, clearSpringCache } from './lib/dedup';

const log = createLogger('PANGAEA');

// Dataset URL - tab-delimited format
const DATASET_URL = 'https://doi.pangaea.de/10.1594/PANGAEA.981233?format=textfile';
const FETCH_TIMEOUT_MS = 60000;

interface PangaeaRecord {
  state: string;
  lat: number;
  lng: number;
  name: string;
  tempF: number | null;
  tempC: number | null;
  tempDesc: string; // B = boiling, H = hot, W = warm
}

/**
 * Fetch the dataset with timeout
 */
async function fetchDataset(): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(DATASET_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SoakMapBot/1.0)',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.status}`);
    }

    return response.text();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out fetching PANGAEA dataset');
    }
    throw err;
  }
}

/**
 * Parse the TSV data, skipping the header comments
 */
function parseDataset(tsv: string): PangaeaRecord[] {
  const lines = tsv.split('\n');
  const records: PangaeaRecord[] = [];

  // Find the header line (starts with "State")
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('State (State code)')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not find header line in dataset');
  }

  // Parse data rows (skip header)
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = line.split('\t');
    if (fields.length < 6) continue;

    const state = fields[0].trim();
    const lat = parseFloat(fields[1]);
    const lng = parseFloat(fields[2]);
    const name = fields[3].trim();
    const tempFStr = fields[4].trim();
    const tempCStr = fields[5].trim();
    const tempDesc = fields[6]?.trim() || '';

    // Validate required fields
    if (!state || isNaN(lat) || isNaN(lng)) continue;

    // Skip entries without names (use coordinates as fallback name)
    const springName = name || `Unnamed Spring (${lat.toFixed(3)}, ${lng.toFixed(3)})`;

    records.push({
      state,
      lat,
      lng,
      name: springName,
      tempF: tempFStr ? parseFloat(tempFStr) : null,
      tempC: tempCStr ? parseFloat(tempCStr) : null,
      tempDesc,
    });
  }

  return records;
}

/**
 * Determine spring type from temperature
 */
function determineSpringType(tempF: number | null, tempDesc: string): 'hot' | 'warm' | 'cold' {
  // Use temperature description if available
  if (tempDesc === 'B' || tempDesc === 'H') return 'hot';
  if (tempDesc === 'W') return 'warm';

  // Use temperature value
  if (tempF !== null) {
    if (tempF >= 100) return 'hot';
    if (tempF >= 68) return 'warm'; // Dataset threshold is 20°C = 68°F
    return 'cold';
  }

  return 'hot'; // Default for geothermal dataset
}

/**
 * Clean and normalize spring name
 */
function cleanName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .trim()
    // Normalize common variations
    .replace(/HOT SPRING$/i, 'Hot Springs')
    .replace(/HOT SPRINGS$/i, 'Hot Springs')
    .replace(/WARM SPRING$/i, 'Warm Springs')
    .replace(/WARM SPRINGS$/i, 'Warm Springs');
}

/**
 * Transform PANGAEA record to our schema
 */
function transformToSpring(record: PangaeaRecord) {
  const name = cleanName(record.name);
  const springType = determineSpringType(record.tempF, record.tempDesc);

  // Build description
  let description = `${name} is a ${springType} spring in ${record.state}.`;
  if (record.tempF) {
    description += ` Water temperature: ${record.tempF}°F (${record.tempC}°C).`;
  }
  description += ' Data from NOAA National Geophysical Data Center.';

  // Generate source_id and slug
  const sourceId = `pangaea-${record.state.toLowerCase()}-${slugify(record.name, record.state.toLowerCase())}`;
  const slug = slugify(name, record.state.toLowerCase());

  return {
    name,
    slug,
    state: record.state,
    location: `POINT(${record.lng} ${record.lat})`,
    lat: record.lat,
    lng: record.lng,
    spring_type: springType,
    experience_type: 'primitive' as const, // Historical NOAA data - assume primitive
    temp_f: record.tempF,
    description,
    confidence: 'medium' as const, // Historical data from 1980
    source: 'pangaea',
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
      // Try individual inserts
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

  log.info('Starting PANGAEA NOAA hot springs import');
  if (dryRun) log.warn('DRY RUN MODE - no data will be inserted');
  if (limit) log.info(`Limiting to ${limit} records`);

  // Fetch dataset
  log.info('Fetching PANGAEA dataset...');
  const tsv = await fetchDataset();
  log.info(`Downloaded ${(tsv.length / 1024).toFixed(1)} KB`);

  // Parse records
  log.info('Parsing dataset...');
  const records = parseDataset(tsv);
  log.info(`Parsed ${records.length} records`);

  // Show state distribution
  const stateCounts = new Map<string, number>();
  for (const record of records) {
    stateCounts.set(record.state, (stateCounts.get(record.state) || 0) + 1);
  }
  const topStates = [...stateCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  log.info(`Top states: ${topStates.map(([s, c]) => `${s}(${c})`).join(', ')}`);

  // Transform to our schema
  const springs = records.map(transformToSpring);

  // Pre-insert deduplication
  log.info('Checking for duplicates against existing database...');
  const { new: newSprings, duplicates } = await filterNewSprings(springs);
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

  // Apply limit
  const springsToInsert = limit ? newSprings.slice(0, limit) : newSprings;

  // Insert into database
  log.info('Inserting into database...');
  const { inserted, errors } = await insertSprings(springsToInsert, dryRun);

  // Clear cache after insert
  clearSpringCache();

  log.done(`Imported ${inserted} springs (${errors} errors, ${duplicates.length} duplicates skipped)`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
