#!/usr/bin/env npx tsx
/**
 * Submit all SoakMap URLs to IndexNow for faster indexing
 *
 * IndexNow is supported by: Bing, Yandex, DuckDuckGo, Naver, Seznam
 * Google does NOT support IndexNow (use Search Console sitemap instead)
 *
 * Usage:
 *   npx tsx scripts/submit-indexnow.ts
 *   npx tsx scripts/submit-indexnow.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const INDEXNOW_KEY = '132b0895159307328ce82b36d75aacd0';
const SITE_HOST = 'www.soakmap.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// All valid state codes
const STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const FILTER_TYPES = ['hot-springs', 'warm-springs', 'swimming-holes'];
const TAG_SLUGS = ['free', 'clothing-optional', 'primitive', 'resort', 'drive-up'];
const TYPE_SLUGS = ['hot-springs', 'swimming-holes', 'warm-springs'];

async function getAllUrls(): Promise<string[]> {
  const urls: string[] = [];
  const base = `https://${SITE_HOST}`;

  // 1. Static pages
  urls.push(base); // Homepage
  urls.push(`${base}/states`);
  urls.push(`${base}/hot-springs-near-me`);
  urls.push(`${base}/swimming-holes-near-me`);
  urls.push(`${base}/natural-springs-near-me`);

  // 2. Type pages
  for (const type of TYPE_SLUGS) {
    urls.push(`${base}/type/${type}`);
  }

  // 3. Tag pages
  for (const tag of TAG_SLUGS) {
    urls.push(`${base}/tag/${tag}`);
  }

  // 4. Get all states with springs from database
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get states with springs
  const { data: states, error: statesError } = await supabase
    .from('states')
    .select('code, hot_count, warm_count, cold_count')
    .gt('spring_count', 0);

  if (statesError) {
    console.error('Error fetching states:', statesError);
    process.exit(1);
  }

  // State pages and state+filter combos
  for (const state of states || []) {
    const code = state.code.toLowerCase();
    urls.push(`${base}/${code}`);

    // Only add filter pages if that state has springs of that type
    if (state.hot_count > 0) {
      urls.push(`${base}/${code}/hot-springs`);
    }
    if (state.warm_count > 0) {
      urls.push(`${base}/${code}/warm-springs`);
    }
    if (state.cold_count > 0) {
      urls.push(`${base}/${code}/swimming-holes`);
    }
  }

  // 5. Get all spring slugs
  const { data: springs, error: springsError } = await supabase
    .from('springs')
    .select('slug');

  if (springsError) {
    console.error('Error fetching springs:', springsError);
    process.exit(1);
  }

  for (const spring of springs || []) {
    urls.push(`${base}/springs/${spring.slug}`);
  }

  return urls;
}

async function submitToIndexNow(urls: string[], dryRun: boolean): Promise<void> {
  console.log(`\n📊 Total URLs to submit: ${urls.length}`);

  if (dryRun) {
    console.log('\n🔍 DRY RUN - Not actually submitting\n');
    console.log('Sample URLs:');
    urls.slice(0, 20).forEach((url) => console.log(`  ${url}`));
    console.log(`  ... and ${urls.length - 20} more`);
    return;
  }

  // IndexNow accepts up to 10,000 URLs per request
  const batchSize = 10000;
  const batches = Math.ceil(urls.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = urls.slice(i * batchSize, (i + 1) * batchSize);
    console.log(`\n📤 Submitting batch ${i + 1}/${batches} (${batch.length} URLs)...`);

    const payload = {
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
      urlList: batch,
    };

    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ Batch ${i + 1} submitted successfully (HTTP ${response.status})`);
      } else {
        const text = await response.text();
        console.error(`❌ Batch ${i + 1} failed: HTTP ${response.status}`);
        console.error(`   Response: ${text}`);
      }
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error);
    }

    // Small delay between batches
    if (i < batches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🔍 IndexNow URL Submission for SoakMap');
  console.log('=====================================');
  console.log(`Host: ${SITE_HOST}`);
  console.log(`Key: ${INDEXNOW_KEY}`);
  console.log(`Endpoint: ${INDEXNOW_ENDPOINT}`);

  console.log('\n📝 Gathering all URLs...');
  const urls = await getAllUrls();

  await submitToIndexNow(urls, dryRun);

  console.log('\n✨ Done!');
  console.log('\nNext steps:');
  console.log('1. Verify key file is accessible: https://soakmap.com/132b0895159307328ce82b36d75aacd0.txt');
  console.log('2. Check Bing Webmaster Tools for indexing status');
  console.log('3. Note: Google does NOT support IndexNow - use Search Console instead');
}

main().catch(console.error);
