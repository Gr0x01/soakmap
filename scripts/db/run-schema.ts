#!/usr/bin/env npx tsx

/**
 * Run the database schema on Supabase
 * Usage: npx tsx scripts/db/run-schema.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runSchema() {
  console.log('Reading schema file...');

  const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Split by major sections (separated by double newlines after comments)
  // We'll run each statement separately for better error handling
  const statements = schema
    .split(/;[\s]*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} statements to execute`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Extract a short description for logging
    const firstLine = statement.split('\n')[0].slice(0, 60);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Some errors are expected (e.g., type already exists)
        if (error.message.includes('already exists')) {
          console.log(`⏭️  [${i + 1}/${statements.length}] Skipped (already exists): ${firstLine}...`);
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
          console.error(`   Statement: ${firstLine}...`);
          errorCount++;
        }
      } else {
        console.log(`✅ [${i + 1}/${statements.length}] Success: ${firstLine}...`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ [${i + 1}/${statements.length}] Exception: ${err}`);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log(`Completed: ${successCount} success, ${errorCount} errors`);
  console.log('========================================\n');

  console.log('Note: If you see errors, you may need to run the SQL directly in Supabase SQL Editor.');
  console.log('Copy the contents of supabase/schema.sql and paste into:');
  console.log(`${supabaseUrl!.replace('.supabase.co', '')}/project/sql`);
}

runSchema().catch(console.error);
