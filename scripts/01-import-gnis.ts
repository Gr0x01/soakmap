#!/usr/bin/env npx tsx
/**
 * Import USGS GNIS hot springs data
 *
 * Data source: https://www.usgs.gov/us-board-on-geographic-names/download-gnis-data
 * File: DomesticNames_National.txt (pipe-delimited)
 *
 * Usage:
 *   npx tsx scripts/01-import-gnis.ts [--dry-run] [--limit N]
 *
 * The script:
 * 1. Downloads GNIS data if not cached
 * 2. Filters for feature_class = "Spring" with "Hot" or "Warm" in name
 * 3. Transforms to our schema
 * 4. Inserts into Supabase (upserts by source_id)
 */

import { createWriteStream, existsSync, createReadStream } from 'fs';
import { mkdir, stat } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';
import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { slugify, chunk, getSpringTypeFromTemp, parseTemperature } from './lib/utils';
import { config } from './lib/config';

const log = createLogger('GNIS');

// GNIS data URL
const GNIS_URL = 'https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/DomesticNames/DomesticNames_National.zip';
const CACHE_DIR = './scripts/data/cache';
const GNIS_ZIP = `${CACHE_DIR}/gnis.zip`;
const GNIS_TXT = `${CACHE_DIR}/DomesticNames_National.txt`;

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
const COLS = {
  feature_id: 0,
  feature_name: 1,
  feature_class: 2,
  state_alpha: 3,
  county_name: 5,
  prim_lat_dec: 9,
  prim_long_dec: 10,
  elev_in_ft: 16,
};

async function downloadGNIS(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });

  // Check if we already have the extracted file
  if (existsSync(GNIS_TXT)) {
    const stats = await stat(GNIS_TXT);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    if (ageHours < 24 * 7) {
      log.info(`Using cached GNIS data (${Math.round(ageHours)}h old)`);
      return;
    }
  }

  log.info('Downloading GNIS data (this may take a while, ~500MB)...');

  const response = await fetch(GNIS_URL);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  // Save zip file
  const fileStream = createWriteStream(GNIS_ZIP);
  await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream);
  log.success('Downloaded GNIS zip');

  // Extract using unzip command (simpler than handling zip in Node)
  log.info('Extracting...');
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  await execAsync(`unzip -o "${GNIS_ZIP}" -d "${CACHE_DIR}"`);
  log.success('Extracted GNIS data');
}

function isHotSpring(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes('hot spring') ||
    lower.includes('warm spring') ||
    lower.includes('thermal spring') ||
    lower.includes('hot pool') ||
    lower.includes('hot well') ||
    lower.includes('mineral spring') ||
    lower.includes('sulphur spring') ||
    lower.includes('sulfur spring')
  );
}

async function parseGNIS(limit?: number): Promise<GNISRecord[]> {
  const records: GNISRecord[] = [];

  const rl = createInterface({
    input: createReadStream(GNIS_TXT, { encoding: 'utf-8' }),
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

    // Must be in US (state code exists)
    const state = cols[COLS.state_alpha];
    if (!state || state.length !== 2) continue;

    records.push({
      feature_id: cols[COLS.feature_id],
      feature_name: name,
      feature_class: cols[COLS.feature_class],
      state_alpha: state,
      county_name: cols[COLS.county_name] || '',
      prim_lat_dec: cols[COLS.prim_lat_dec],
      prim_long_dec: cols[COLS.prim_long_dec],
      elev_in_ft: cols[COLS.elev_in_ft] || '',
    });

    if (limit && records.length >= limit) break;

    // Progress every 100k lines
    if (lineCount % 100000 === 0) {
      log.debug(`Scanned ${lineCount} lines, found ${records.length} hot springs...`);
    }
  }

  log.info(`Scanned ${lineCount} lines, found ${records.length} hot springs`);
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

  log.info('Starting GNIS import');
  if (dryRun) log.warn('DRY RUN MODE - no data will be inserted');
  if (limit) log.info(`Limiting to ${limit} records`);

  // Download if needed
  await downloadGNIS();

  // Parse GNIS data
  log.info('Parsing GNIS data...');
  const records = await parseGNIS(limit);

  if (records.length === 0) {
    log.warn('No hot springs found in GNIS data');
    return;
  }

  // Transform to our schema
  log.info('Transforming records...');
  const springs = records.map(transformToSpring);

  // Insert into database
  log.info('Inserting into database...');
  const { inserted, errors } = await insertSprings(springs, dryRun);

  log.done(`Imported ${inserted} springs (${errors} errors)`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
