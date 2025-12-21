#!/usr/bin/env npx tsx
/**
 * Upload a local photo to Supabase Storage and update the spring's photo_url
 *
 * Usage:
 *   npx tsx scripts/upload-photo.ts <file-path> <spring-slug>
 *   npx tsx scripts/upload-photo.ts tmp/BAUMGARTNER\ Hot\ Springs\ .webp baumgartner-hot-springs-id
 */

import { supabase } from './lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function uploadPhoto(filePath: string, springSlug: string) {
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  // Read file
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Determine content type
  const contentTypes: Record<string, string> = {
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
  };

  const contentType = contentTypes[ext];
  if (!contentType) {
    console.error(`Unsupported file type: ${ext}`);
    process.exit(1);
  }

  // Upload path: springs/{slug}/main.webp
  const storagePath = `${springSlug}/main${ext}`;

  console.log(`Uploading ${filePath} to springs/${storagePath}...`);

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('springs')
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true, // Overwrite if exists
    });

  if (uploadError) {
    console.error('Upload failed:', uploadError.message);
    process.exit(1);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('springs')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;
  console.log(`Uploaded to: ${publicUrl}`);

  // Update spring's photo_url
  const { data: spring, error: updateError } = await supabase
    .from('springs')
    .update({ photo_url: publicUrl })
    .eq('slug', springSlug)
    .select('name, slug, photo_url')
    .single();

  if (updateError) {
    console.error('Database update failed:', updateError.message);
    process.exit(1);
  }

  console.log(`\n✅ Updated ${spring.name}`);
  console.log(`   photo_url: ${spring.photo_url}`);
}

// Parse args
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: npx tsx scripts/upload-photo.ts <file-path> <spring-slug>');
  console.log('Example: npx tsx scripts/upload-photo.ts tmp/photo.webp goldbug-hot-springs-id');
  process.exit(1);
}

const [filePath, springSlug] = args;
uploadPhoto(filePath, springSlug);
