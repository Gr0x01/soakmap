#!/usr/bin/env npx tsx
/**
 * Migrate external photo URLs to Supabase Storage
 *
 * Downloads photos from external URLs (Wikimedia Commons, etc.) and uploads
 * them to our own Supabase Storage bucket.
 *
 * Usage:
 *   npx tsx scripts/13-migrate-photos-to-storage.ts --limit 10 --dry-run
 *   npx tsx scripts/13-migrate-photos-to-storage.ts --limit 100
 *   npx tsx scripts/13-migrate-photos-to-storage.ts  # All photos
 */

import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';

const logger = createLogger('migrate-photos');

const SUPABASE_STORAGE_HOST = 'mrqmxspdxscigtjhxawz.supabase.co';
const CONCURRENCY = 5;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

interface Spring {
  id: string;
  slug: string;
  name: string;
  photo_url: string | null;
}

interface MigrationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ slug: string; error: string }>;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  attempts: number = RETRY_ATTEMPTS
): Promise<ArrayBuffer | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SoakMap/1.0 (https://soakmap.com; contact@soakmap.com)',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`Photo not found (404): ${url}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      if (i < attempts - 1) {
        logger.warn(`Retry ${i + 1}/${attempts} for ${url}`);
        await sleep(RETRY_DELAY_MS * (i + 1));
      } else {
        throw error;
      }
    }
  }
  return null;
}

function getContentType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.gif')) return 'image/gif';
  // Default to JPEG for most photos
  return 'image/jpeg';
}

function getExtension(contentType: string): string {
  switch (contentType) {
    case 'image/webp':
      return '.webp';
    case 'image/png':
      return '.png';
    case 'image/gif':
      return '.gif';
    default:
      return '.jpg';
  }
}

async function migratePhoto(
  spring: Spring,
  dryRun: boolean
): Promise<{ success: boolean; error?: string }> {
  const { slug, photo_url } = spring;

  if (!photo_url) {
    return { success: false, error: 'No photo URL' };
  }

  // Skip if already in our storage
  if (photo_url.includes(SUPABASE_STORAGE_HOST)) {
    return { success: false, error: 'Already migrated' };
  }

  if (dryRun) {
    logger.info(`[DRY RUN] Would migrate: ${slug} <- ${photo_url}`);
    return { success: true };
  }

  try {
    // Download the image
    const imageData = await fetchWithRetry(photo_url);
    if (!imageData) {
      return { success: false, error: 'Failed to download' };
    }

    // Determine content type and extension
    const contentType = getContentType(photo_url);
    const ext = getExtension(contentType);
    const storagePath = `${slug}/main${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('springs')
      .upload(storagePath, imageData, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('springs')
      .getPublicUrl(storagePath);

    // Update database
    const { error: updateError } = await supabase
      .from('springs')
      .update({ photo_url: urlData.publicUrl })
      .eq('id', spring.id);

    if (updateError) {
      return { success: false, error: `DB update failed: ${updateError.message}` };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

async function migrateBatch(
  springs: Spring[],
  dryRun: boolean,
  result: MigrationResult
): Promise<void> {
  const promises = springs.map(async (spring) => {
    const outcome = await migratePhoto(spring, dryRun);

    if (outcome.success) {
      result.success++;
      logger.success(`Migrated: ${spring.slug}`);
    } else if (outcome.error === 'Already migrated') {
      result.skipped++;
    } else {
      result.failed++;
      result.errors.push({ slug: spring.slug, error: outcome.error || 'Unknown' });
      logger.error(`Failed: ${spring.slug} - ${outcome.error}`);
    }
  });

  await Promise.all(promises);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;
  const offsetIndex = args.indexOf('--offset');
  const offset = offsetIndex !== -1 ? parseInt(args[offsetIndex + 1], 10) : 0;

  logger.info('='.repeat(60));
  logger.info('Photo Migration to Supabase Storage');
  logger.info('='.repeat(60));
  if (dryRun) logger.warn('DRY RUN MODE - No changes will be made');
  if (limit) logger.info(`Limit: ${limit} photos`);
  if (offset) logger.info(`Offset: skipping first ${offset} photos`);

  // Fetch springs with external photo URLs
  let query = supabase
    .from('springs')
    .select('id, slug, name, photo_url')
    .not('photo_url', 'is', null)
    .not('photo_url', 'like', `%${SUPABASE_STORAGE_HOST}%`)
    .order('name');

  if (limit) {
    query = query.limit(limit);
  }

  if (offset) {
    query = query.range(offset, offset + (limit || 10000) - 1);
  }

  const { data: springs, error } = await query;

  if (error) {
    logger.error(`Failed to fetch springs: ${error.message}`);
    process.exit(1);
  }

  if (!springs || springs.length === 0) {
    logger.info('No photos to migrate!');
    return;
  }

  logger.info(`Found ${springs.length} photos to migrate`);
  logger.info('');

  const result: MigrationResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Process in batches
  for (let i = 0; i < springs.length; i += CONCURRENCY) {
    const batch = springs.slice(i, i + CONCURRENCY);
    const progress = `[${i + 1}-${Math.min(i + CONCURRENCY, springs.length)}/${springs.length}]`;
    logger.info(`${progress} Processing batch...`);

    await migrateBatch(batch as Spring[], dryRun, result);

    // Small delay between batches to be nice to external servers
    if (i + CONCURRENCY < springs.length) {
      await sleep(500);
    }
  }

  // Summary
  logger.info('');
  logger.info('='.repeat(60));
  logger.info('Migration Summary');
  logger.info('='.repeat(60));
  logger.info(`✅ Success: ${result.success}`);
  logger.info(`⏭️  Skipped: ${result.skipped}`);
  logger.info(`❌ Failed:  ${result.failed}`);

  if (result.errors.length > 0) {
    logger.info('');
    logger.info('Failed photos:');
    result.errors.slice(0, 20).forEach(({ slug, error }) => {
      logger.info(`  - ${slug}: ${error}`);
    });
    if (result.errors.length > 20) {
      logger.info(`  ... and ${result.errors.length - 20} more`);
    }
  }
}

main().catch((error) => {
  logger.error(`Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
