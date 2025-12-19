#!/usr/bin/env npx tsx
/**
 * Import USGS GNIS hot springs data
 *
 * Data source: https://www.usgs.gov/us-board-on-geographic-names/download-gnis-data
 * Files: Per-state DomesticNames_XX_Text.zip files (pipe-delimited)
 *
 * Usage:
 *   npx tsx scripts/01-import-gnis.ts [--dry-run] [--limit N] [--state XX]
 *
 * The script:
 * 1. Downloads GNIS state data files if not cached
 * 2. Filters for feature_class = "Spring" with "Hot" or "Warm" in name
 * 3. Transforms to our schema
 * 4. Inserts into Supabase (upserts by source_id)
 */

import { createWriteStream, existsSync, createReadStream } from 'fs';
import { mkdir, stat, readdir } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { createInterface } from 'readline';
import AdmZip from 'adm-zip';
import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { slugify, chunk, getSpringTypeFromTemp, parseTemperature, sleep } from './lib/utils';
import { config } from './lib/config';

// Constants
const CACHE_MAX_AGE_HOURS = 24 * 7; // 1 week
const FETCH_TIMEOUT_MS = 60000; // 60 seconds per state file

const log = createLogger('GNIS');

// GNIS base URL - now per-state files
const GNIS_BASE_URL = 'https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/DomesticNames';
const CACHE_DIR = './scripts/data/cache/gnis';

// All US state codes
const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

interface GNISRecord {
  feature_id: string;
  feature_name: string;
  feature_class: string;
  state_alpha: string;
  county_name: string;
  prim_lat_dec: string;
  prim_long_dec: string;
  elev_in_ft: string;
}

// GNIS column indexes (pipe-delimited)
// Header: feature_id|feature_name|feature_class|state_name|state_numeric|county_name|...
//         |prim_lat_dec|prim_long_dec|...
const COLS = {
  feature_id: 0,
  feature_name: 1,
  feature_class: 2,
  state_name: 3,  // Full state name like "California"
  county_name: 5,
  prim_lat_dec: 15,
  prim_long_dec: 16,
};

// Map state names to abbreviations
const STATE_ABBREVS: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
};

async function downloadStateFile(stateCode: string): Promise<string | null> {
  await mkdir(CACHE_DIR, { recursive: true });

  const zipPath = `${CACHE_DIR}/DomesticNames_${stateCode}_Text.zip`;
  // The extracted file is in Text/ subdirectory without _Text suffix
  const txtPath = `${CACHE_DIR}/Text/DomesticNames_${stateCode}.txt`;

  // Check if we already have the extracted file
  if (existsSync(txtPath)) {
    try {
      const stats = await stat(txtPath);
      const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
      if (ageHours < CACHE_MAX_AGE_HOURS) {
        return txtPath;
      }
    } catch {
      // File might be corrupted, re-download
    }
  }

  const url = `${GNIS_BASE_URL}/DomesticNames_${stateCode}_Text.zip`;

  // Fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        log.debug(`No GNIS file for ${stateCode}`);
        return null;
      }
      throw new Error(`Failed to download ${stateCode}: ${response.status}`);
    }

    // Save zip file
    const fileStream = createWriteStream(zipPath);
    await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream);

    // Extract using adm-zip (safe, no shell injection)
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(CACHE_DIR, true);

    // Return the known path
    if (existsSync(txtPath)) {
      return txtPath;
    }

    log.warn(`Expected file not found after extraction: ${txtPath}`);
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      log.warn(`Download timed out for ${stateCode}`);
      return null;
    }
    throw err;
  }
}

function isHotSpring(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes('hot spring') ||   // covers "Hot Spring" and "Hot Springs"
    lower.includes('warm spring') ||  // covers "Warm Spring" and "Warm Springs"
    lower.includes('thermal') ||
    lower.includes('hot pool') ||
    lower.includes('hot well') ||
    lower.includes('mineral spring') ||
    lower.includes('sulphur') ||
    lower.includes('sulfur')
  );
}

async function parseStateFile(filePath: string, limit?: number): Promise<GNISRecord[]> {
  const records: GNISRecord[] = [];

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    lineCount++;
    const cols = line.split('|');

    // Filter: must be a Spring feature class
    if (cols[COLS.feature_class] !== 'Spring') continue;

    // Filter: must have hot/warm/thermal in name (or be a mineral spring)
    const name = cols[COLS.feature_name];
    if (!isHotSpring(name)) continue;

    // Must have valid coordinates
    const lat = parseFloat(cols[COLS.prim_lat_dec]);
    const lng = parseFloat(cols[COLS.prim_long_dec]);
    if (isNaN(lat) || isNaN(lng)) continue;

    // Must be in US (state name must map to abbreviation)
    const stateName = cols[COLS.state_name];
    const state = STATE_ABBREVS[stateName];
    if (!state) continue;

    records.push({
      feature_id: cols[COLS.feature_id],
      feature_name: name,
      feature_class: cols[COLS.feature_class],
      state_alpha: state,
      county_name: cols[COLS.county_name] || '',
      prim_lat_dec: cols[COLS.prim_lat_dec],
      prim_long_dec: cols[COLS.prim_long_dec],
      elev_in_ft: '',  // Not needed for now
    });

    if (limit && records.length >= limit) break;
  }

  return records;
}

function transformToSpring(record: GNISRecord) {
  const name = record.feature_name;
  const state = record.state_alpha;
  const lat = parseFloat(record.prim_lat_dec);
  const lng = parseFloat(record.prim_long_dec);

  // Try to extract temperature from name
  const tempF = parseTemperature(name);

  // Determine spring type
  const springType = getSpringTypeFromTemp(tempF);

  // Generate description
  const county = record.county_name ? ` in ${record.county_name} County` : '';
  const description = `${name} is a natural hot spring located${county}, ${state}. Listed in the USGS Geographic Names Information System.`;

  return {
    name,
    slug: slugify(name, state),
    state,
    location: `POINT(${lng} ${lat})`,
    spring_type: springType,
    experience_type: 'primitive' as const, // Default, will be enriched later
    description,
    temp_f: tempF,
    source: 'gnis',
    source_id: `gnis-${record.feature_id}`,
    enrichment_status: 'pending',
    confidence: 'low' as const, // Low until enriched
  };
}

async function insertSprings(springs: ReturnType<typeof transformToSpring>[], dryRun: boolean) {
  if (dryRun) {
    log.info(`[DRY RUN] Would insert ${springs.length} springs`);
    log.info('Sample:', springs.slice(0, 3));
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
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined;
  const stateIdx = args.indexOf('--state');
  const singleState = stateIdx >= 0 ? args[stateIdx + 1]?.toUpperCase() : undefined;

  log.info('Starting GNIS import');
  if (dryRun) log.warn('DRY RUN MODE - no data will be inserted');
  if (singleState) log.info(`Single state mode: ${singleState}`);
  if (limit) log.info(`Limiting to ${limit} records`);

  const statesToProcess = singleState ? [singleState] : STATES;
  const allRecords: GNISRecord[] = [];

  // Download and parse state files
  for (let i = 0; i < statesToProcess.length; i++) {
    const state = statesToProcess[i];
    log.progress(i + 1, statesToProcess.length, `Processing ${state}`);

    try {
      const filePath = await downloadStateFile(state);
      if (!filePath) {
        continue;
      }

      const records = await parseStateFile(filePath, limit ? limit - allRecords.length : undefined);
      log.info(`${state}: found ${records.length} hot springs`);
      allRecords.push(...records);

      if (limit && allRecords.length >= limit) {
        log.info(`Reached limit of ${limit}`);
        break;
      }

      // Rate limiting between downloads
      if (i < statesToProcess.length - 1) {
        await sleep(500);
      }
    } catch (err) {
      log.error(`Error processing ${state}: ${err}`);
    }
  }

  if (allRecords.length === 0) {
    log.warn('No hot springs found in GNIS data');
    return;
  }

  log.info(`Total hot springs found: ${allRecords.length}`);

  // Transform to our schema
  log.info('Transforming records...');
  const springs = allRecords.map(transformToSpring);

  // Insert into database
  log.info('Inserting into database...');
  const { inserted, errors } = await insertSprings(springs, dryRun);

  log.done(`Imported ${inserted} springs (${errors} errors)`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
