#!/usr/bin/env npx tsx
/**
 * Generate SEO-optimized narrative descriptions for springs
 *
 * Usage:
 *   npx tsx scripts/11-generate-seo-narratives.ts [--dry-run] [--limit N] [--state XX] [--model MODEL]
 *
 * This script:
 * 1. Fetches springs with seo_status = 'pending' (prioritizes enriched springs)
 * 2. Generates rich narrative descriptions using GPT-4.1-mini
 * 3. Updates seo_description field
 *
 * Run AFTER 04-enrich-springs.ts for best results (uses enrichment data for context)
 */

import OpenAI from 'openai';
import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { sleep } from './lib/utils';
import { config } from './lib/config';
import { getStateName } from '../src/lib/utils/states';

const log = createLogger('SEO');

// Constants
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;
const DEFAULT_CONCURRENCY = 50; // Tier 5 OpenAI allows high concurrency
const DEFAULT_MODEL = 'gpt-4.1-mini'; // Best prose quality for narratives

// Token tracking
let totalInputTokens = 0;
let totalOutputTokens = 0;

// Initialize OpenAI (lazy)
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return openai;
}

interface Spring {
  id: string;
  name: string;
  state: string;
  spring_type: string;
  experience_type: string;
  description: string | null;
  temp_f: number | null;
  access_difficulty: string | null;
  parking: string | null;
  time_from_parking_min: number | null;
  fee_type: string | null;
  fee_amount_usd: number | null;
  crowd_level: string | null;
  best_season: string | null;
  clothing_optional: string | null;
  pool_count: number | null;
  lat: number;
  lng: number;
}

interface NarrativeResult {
  springId: string;
  springName: string;
  narrative: string | null;
  error?: string;
}


const NARRATIVE_PROMPT = `You are an expert travel writer creating SEO-optimized descriptions for a natural springs directory. Write engaging, informative content that helps visitors decide if this spring is right for them.

FORMAT - Use exactly this structure with markdown headers:
## About [Spring Name]
Opening paragraph introducing the spring, its character, and what makes it special. 2-3 sentences.

## Getting There
Access information: how to reach it, parking situation, any hiking required. 2-3 sentences.

## What to Expect
The experience: water conditions, atmosphere, crowds, facilities. 2-3 sentences.

## Tips for Visitors
Practical advice: best times, what to bring, fees, any rules. 2-3 sentences.

GUIDELINES:
- Total length: 150-250 words across all sections
- Use vivid, sensory language that evokes the experience
- Naturally incorporate keywords: "[spring name]", "hot springs in [state]", "[state] swimming holes"
- Be honest about challenges (difficult access, crowds, etc.) - authenticity builds trust
- Avoid clichés like "hidden gem" or "best-kept secret"
- Do NOT use phrases like "whether you're..." or "perfect for..."
- Write in present tense, second person ("you") for immersion
- Keep paragraphs short and scannable

TONE:
- For primitive springs: adventurous, authentic, respect for nature
- For resort springs: welcoming, relaxing, accessible
- For hybrid springs: balanced, versatile, best of both worlds

OUTPUT:
Return ONLY the markdown content with the headers. No extra quotes, labels, or explanation.`;

/**
 * Build context about the spring for the LLM
 */
function buildSpringContext(spring: Spring): string {
  const stateName = getStateName(spring.state);
  const lines: string[] = [
    `Spring: ${spring.name}`,
    `Location: ${stateName}`,
    `Type: ${spring.spring_type} spring (${spring.experience_type})`,
  ];

  if (spring.description) {
    lines.push(`Current description: ${spring.description.slice(0, 500)}`);
  }

  if (spring.temp_f) {
    lines.push(`Water temperature: ${spring.temp_f}°F`);
  }

  if (spring.access_difficulty) {
    const accessMap: Record<string, string> = {
      drive_up: 'Drive-up access (no hiking required)',
      short_walk: 'Short walk (2-15 minutes)',
      moderate_hike: 'Moderate hike (15-60 minutes)',
      difficult_hike: 'Difficult hike (60+ minutes, strenuous)',
    };
    lines.push(`Access: ${accessMap[spring.access_difficulty] || spring.access_difficulty}`);
  }

  if (spring.time_from_parking_min) {
    lines.push(`Walk from parking: ${spring.time_from_parking_min} minutes`);
  }

  if (spring.parking) {
    lines.push(`Parking: ${spring.parking.replace(/_/g, ' ')}`);
  }

  if (spring.fee_type) {
    if (spring.fee_type === 'paid' && spring.fee_amount_usd) {
      lines.push(`Fee: $${spring.fee_amount_usd}`);
    } else {
      lines.push(`Fee: ${spring.fee_type}`);
    }
  }

  if (spring.crowd_level) {
    const crowdMap: Record<string, string> = {
      empty: 'Often empty - you may have it to yourself',
      quiet: 'Quiet - few other visitors',
      moderate: 'Moderate crowds - expect others',
      busy: 'Busy - popular spot, sharing space',
      packed: 'Very crowded - may need to wait for space',
    };
    lines.push(`Crowds: ${crowdMap[spring.crowd_level] || spring.crowd_level}`);
  }

  if (spring.best_season) {
    lines.push(`Best season: ${spring.best_season.replace(/_/g, ' ')}`);
  }

  if (spring.clothing_optional && spring.clothing_optional !== 'unknown') {
    const clothingMap: Record<string, string> = {
      yes: 'Clothing optional',
      no: 'Clothing required',
      unofficial: 'Unofficially clothing optional',
    };
    lines.push(clothingMap[spring.clothing_optional] || '');
  }

  if (spring.pool_count && spring.pool_count > 1) {
    lines.push(`Number of pools: ${spring.pool_count}`);
  }

  return lines.join('\n');
}

/**
 * Generate narrative for a single spring
 */
async function generateNarrative(
  spring: Spring,
  model: string
): Promise<NarrativeResult> {
  const context = buildSpringContext(spring);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await getOpenAI().chat.completions.create({
        model,
        messages: [
          { role: 'system', content: NARRATIVE_PROMPT },
          { role: 'user', content: context },
        ],
        max_tokens: 600,
      });

      // Track tokens
      if (response.usage) {
        totalInputTokens += response.usage.prompt_tokens;
        totalOutputTokens += response.usage.completion_tokens;
      }

      const narrative = response.choices[0]?.message?.content?.trim();
      if (!narrative || narrative.length < 50) {
        return {
          springId: spring.id,
          springName: spring.name,
          narrative: null,
          error: 'Narrative too short or empty',
        };
      }

      // Basic cleanup
      let cleaned = narrative
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/^\*\*.*?\*\*\s*/g, '') // Remove markdown bold headers
        .trim();

      // Validate cleaned content isn't empty after cleanup
      if (!cleaned || cleaned.length < 50) {
        return {
          springId: spring.id,
          springName: spring.name,
          narrative: null,
          error: 'Narrative empty after cleanup',
        };
      }

      // Validate length (warn if outside target range)
      const wordCount = cleaned.split(/\s+/).length;
      if (wordCount > 250) {
        log.warn(`${spring.name}: narrative is ${wordCount} words (target: 150-200, max: 250)`);
      } else if (wordCount < 100) {
        log.warn(`${spring.name}: narrative is short (${wordCount} words, target: 150-200)`);
      }

      return {
        springId: spring.id,
        springName: spring.name,
        narrative: cleaned,
      };
    } catch (err) {
      const isRateLimit =
        err instanceof Error &&
        'status' in err &&
        (err as { status?: number }).status === 429;

      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        const waitTime = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        log.warn(`Rate limited, waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
        continue;
      }

      return {
        springId: spring.id,
        springName: spring.name,
        narrative: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  return {
    springId: spring.id,
    springName: spring.name,
    narrative: null,
    error: 'Max retries exceeded',
  };
}

/**
 * Process springs in batches
 */
async function processBatch(
  springs: Spring[],
  concurrency: number,
  model: string,
  dryRun: boolean
): Promise<{ generated: number; errors: number }> {
  let generated = 0;
  let errors = 0;

  for (let i = 0; i < springs.length; i += concurrency) {
    const chunk = springs.slice(i, i + concurrency);
    log.info(`Processing ${i + 1}-${i + chunk.length} of ${springs.length}...`);

    // Generate narratives in parallel
    const results = await Promise.all(
      chunk.map((spring) => generateNarrative(spring, model))
    );

    // Rate limit between batches
    if (i + concurrency < springs.length) {
      await sleep(500); // Longer delay for more expensive model
    }

    // Process results
    for (const result of results) {
      if (result.error) {
        log.error(`${result.springName}: ${result.error}`);
        errors++;
        continue;
      }

      if (!result.narrative) {
        errors++;
        continue;
      }

      if (dryRun) {
        log.info(`[DRY RUN] ${result.springName}:`);
        console.log(`\n${result.narrative}\n`);
        generated++;
      } else {
        const { error: updateError } = await supabase
          .from('springs')
          .update({
            description: result.narrative,
            seo_status: 'generated',
            updated_at: new Date().toISOString(),
          })
          .eq('id', result.springId);

        if (updateError) {
          log.error(`Failed to update ${result.springName}: ${updateError.message}`);
          errors++;
        } else {
          generated++;
        }
      }
    }

    log.info(`Progress: ${generated} generated, ${errors} errors`);
  }

  return { generated, errors };
}

/**
 * Estimate cost based on token usage
 */
function estimateCost(model: string): string {
  // OpenAI pricing per 1M tokens (December 2024 - verify at openai.com/api/pricing)
  // Batch API = 50% of standard pricing
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4.1-mini': { input: 0.40, output: 1.60 }, // Standard
    'gpt-4.1': { input: 2.00, output: 8.00 }, // Standard
    'gpt-4o-mini': { input: 0.15, output: 0.60 }, // Standard
  };

  const rates = pricing[model] || pricing['gpt-4.1-mini'];
  const inputCost = (totalInputTokens / 1_000_000) * rates.input;
  const outputCost = (totalOutputTokens / 1_000_000) * rates.output;
  const total = inputCost + outputCost;

  return `$${total.toFixed(4)} (${totalInputTokens.toLocaleString()} input + ${totalOutputTokens.toLocaleString()} output tokens)`;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 50;
  const stateIdx = args.indexOf('--state');
  const stateFilter = stateIdx >= 0 ? args[stateIdx + 1]?.toUpperCase() : undefined;
  const modelIdx = args.indexOf('--model');
  const model = modelIdx >= 0 ? args[modelIdx + 1] : DEFAULT_MODEL;
  const concurrencyIdx = args.indexOf('--concurrency');
  const concurrency = concurrencyIdx >= 0 ? parseInt(args[concurrencyIdx + 1], 10) : DEFAULT_CONCURRENCY;

  log.info('Starting SEO narrative generation');
  log.info(`Model: ${model}, Limit: ${limit}, Concurrency: ${concurrency}`);
  if (dryRun) log.warn('DRY RUN MODE - no data will be updated');
  if (stateFilter) log.info(`Filtering by state: ${stateFilter}`);

  if (!config.openai.apiKey) {
    log.error('OPENAI_API_KEY not set');
    process.exit(1);
  }

  // Fetch springs - prioritize enriched ones (they have more context)
  let query = supabase
    .from('springs')
    .select(`
      id, name, state, spring_type, experience_type, description,
      temp_f, access_difficulty, parking, time_from_parking_min,
      fee_type, fee_amount_usd, crowd_level, best_season,
      clothing_optional, pool_count, lat, lng
    `)
    .eq('seo_status', 'pending')
    .order('enrichment_status', { ascending: true }) // 'enriched' comes before 'pending' alphabetically
    .order('created_at', { ascending: true }) // Then oldest first for deterministic order
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
    log.info('No springs pending SEO narrative generation');
    return;
  }

  log.info(`Found ${springs.length} springs to process`);

  const startTime = Date.now();
  const { generated, errors } = await processBatch(
    springs as Spring[],
    concurrency,
    model,
    dryRun
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log.done(`Generated ${generated} narratives (${errors} errors) in ${elapsed}s`);
  log.info(`Estimated cost: ${estimateCost(model)}`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
