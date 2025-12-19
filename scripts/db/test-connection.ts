#!/usr/bin/env npx tsx

/**
 * Test Supabase connection
 * Usage: npx tsx scripts/db/test-connection.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  // Test 1: Basic connection
  console.log('\n1. Testing basic connection...');
  const { data: healthCheck, error: healthError } = await supabase
    .from('states')
    .select('code')
    .limit(1);

  if (healthError) {
    if (healthError.message.includes('does not exist')) {
      console.log('   ⚠️  States table does not exist yet - schema needs to be run');
    } else {
      console.log('   ❌ Error:', healthError.message);
    }
  } else {
    console.log('   ✅ Connected successfully');
    console.log('   States found:', healthCheck?.length || 0);
  }

  // Test 2: Check if PostGIS is enabled
  console.log('\n2. Checking PostGIS extension...');
  const { data: extensions, error: extError } = await supabase.rpc('postgis_version');

  if (extError) {
    if (extError.message.includes('does not exist')) {
      console.log('   ⚠️  PostGIS not enabled yet - run schema SQL first');
    } else {
      console.log('   ⚠️  Could not verify PostGIS:', extError.message);
    }
  } else {
    console.log('   ✅ PostGIS version:', extensions);
  }

  // Test 3: Check springs table
  console.log('\n3. Checking springs table...');
  const { data: springs, error: springsError } = await supabase
    .from('springs')
    .select('id')
    .limit(1);

  if (springsError) {
    if (springsError.message.includes('does not exist')) {
      console.log('   ⚠️  Springs table does not exist yet - schema needs to be run');
    } else {
      console.log('   ❌ Error:', springsError.message);
    }
  } else {
    console.log('   ✅ Springs table exists');
    console.log('   Springs count:', springs?.length || 0);
  }

  console.log('\n========================================');
  console.log('Connection test complete');
  console.log('========================================');
  console.log('\nIf tables are missing, run the schema SQL in Supabase SQL Editor:');
  console.log('1. Go to: https://supabase.com/dashboard/project/mrqmxspdxscigtjhxawz/sql');
  console.log('2. Copy contents of: supabase/schema.sql');
  console.log('3. Paste and run');
}

testConnection().catch(console.error);
