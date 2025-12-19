#!/usr/bin/env npx tsx
/**
 * Enrich springs with Tavily search + gpt-4o-mini extraction
 *
 * Usage:
 *   npx tsx scripts/04-enrich-springs.ts [--dry-run] [--limit N] [--state XX]
 *
 * The script:
 * 1. Fetches springs with enrichment_status = 'pending'
 * 2. For each spring, searches Tavily for additional info
 * 3. Extracts structured data using gpt-4o-mini
 * 4. Updates the spring record
 */

import OpenAI from 'openai';
import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import { sleep } from './lib/utils';
import { config } from './lib/config';

const log = createLogger('Enrich');

// Constants
const FETCH_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

// Initialize OpenAI (lazy - only when needed)
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return openai;
}

interface TavilyResponse {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
  }>;
}

interface EnrichmentData {
  temp_f?: number | null;
  access_difficulty?: 'drive_up' | 'short_walk' | 'moderate_hike' | 'difficult_hike' | null;
  parking?: 'ample' | 'limited' | 'very_limited' | 'roadside' | 'trailhead' | null;
  time_from_parking_min?: number | null;
  cell_service?: 'full' | 'partial' | 'none' | 'unknown' | null;
  fee_type?: 'free' | 'paid' | 'donation' | 'unknown' | null;
  fee_amount_usd?: number | null;
  crowd_level?: 'empty' | 'quiet' | 'moderate' | 'busy' | 'packed' | null;
  best_season?: 'spring' | 'summer' | 'fall' | 'winter' | 'year_round' | null;
  clothing_optional?: 'yes' | 'no' | 'unofficial' | 'unknown' | null;
  pool_count?: number | null;
  description?: string;
  experience_type?: 'resort' | 'primitive' | 'hybrid';
  confidence?: 'high' | 'medium' | 'low';
}

const EXTRACTION_PROMPT = `You are a data extraction assistant for a natural springs directory. Extract structured data from the provided text snippets about a spring/swimming hole.

CRITICAL - Use ONLY these exact enum values (anything else will fail validation):
- spring_type: "hot" | "warm" | "cold"
- experience_type: "resort" | "primitive" | "hybrid"
- access_difficulty: "drive_up" | "short_walk" | "moderate_hike" | "difficult_hike"
- parking: "ample" | "limited" | "very_limited" | "roadside" | "trailhead"
- cell_service: "full" | "partial" | "none" | "unknown"
- fee_type: "free" | "paid" | "donation" | "unknown"
- crowd_level: "empty" | "quiet" | "moderate" | "busy" | "packed"
- best_season: "spring" | "summer" | "fall" | "winter" | "year_round"
- clothing_optional: "yes" | "no" | "unofficial" | "unknown"
- confidence: "high" | "medium" | "low"

For access_difficulty:
- "drive_up" = Park and you're there (0-2 min walk)
- "short_walk" = 2-15 min easy walk
- "moderate_hike" = 15-60 min with some effort
- "difficult_hike" = 60+ min, strenuous

For crowd_level:
- "empty" = Often have it to yourself
- "quiet" = Few other visitors
- "moderate" = Expect others
- "busy" = Popular, sharing space
- "packed" = Very crowded, may wait

Return a JSON object with these fields (use null if unknown):
{
  "temp_f": number or null (water temperature in Fahrenheit),
  "access_difficulty": enum or null,
  "parking": enum or null,
  "time_from_parking_min": number or null (walk time in minutes),
  "cell_service": enum or null,
  "fee_type": enum or null,
  "fee_amount_usd": number or null (if paid),
  "crowd_level": enum or null,
  "best_season": enum or null,
  "clothing_optional": enum or null,
  "pool_count": number or null (for hot springs),
  "experience_type": enum or null (override if clearly wrong),
  "description": string or null (2-3 sentence summary if better info available),
  "confidence": "high" | "medium" | "low" (how confident you are in the data)
}

Return ONLY the JSON object, no markdown or explanation.`;

/**
 * Search Tavily for spring information with timeout and validation
 */
async function searchTavily(springName: string, state: string): Promise<string[]> {
  if (!config.tavily.apiKey) {
    log.warn('No Tavily API key, skipping search');
    return [];
  }

  const query = `"${springName}" ${state} hot spring swimming hole`;

  // Fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: config.tavily.apiKey,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: false,
        include_raw_content: false,
      }),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Tavily error: ${response.status}`);
    }

    const data: unknown = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      log.warn('Unexpected Tavily response format: not an object');
      return [];
    }

    const tavilyResponse = data as TavilyResponse;
    if (!tavilyResponse.results || !Array.isArray(tavilyResponse.results)) {
      log.warn('Unexpected Tavily response format: no results array');
      return [];
    }

    return tavilyResponse.results
      .filter((r) => r && r.title && r.content)
      .map((r) => `${r.title}: ${r.content}`);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      log.error('Tavily search timed out');
    } else {
      log.error(`Tavily search failed: ${err}`);
    }
    return [];
  }
}

/**
 * Extract structured data using gpt-4o-mini with retry on rate limits
 */
async function extractWithLLM(
  springName: string,
  state: string,
  existingDescription: string,
  snippets: string[]
): Promise<EnrichmentData | null> {
  if (!config.openai.apiKey) {
    log.warn('No OpenAI API key, skipping extraction');
    return null;
  }

  const context = [
    `Spring: ${springName}, ${state}`,
    `Current description: ${existingDescription}`,
    '',
    'Web search snippets:',
    ...snippets.map((s, i) => `[${i + 1}] ${s}`),
  ].join('\n');

  // Retry loop for rate limits
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await getOpenAI().chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          { role: 'user', content: context },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return null;

      // Parse and validate JSON response
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object' || parsed === null) {
          log.warn('Invalid enrichment data structure: not an object');
          return null;
        }
        return parsed as EnrichmentData;
      } catch (parseErr) {
        log.error(`Failed to parse LLM JSON response: ${content.substring(0, 100)}`);
        return null;
      }
    } catch (err) {
      // Check for rate limit error (429)
      const isRateLimit =
        err instanceof Error &&
        ('status' in err && (err as { status?: number }).status === 429);

      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        const waitTime = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        log.warn(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 2}/${MAX_RETRIES}...`);
        await sleep(waitTime);
        continue;
      }

      log.error(`LLM extraction failed: ${err}`);
      return null;
    }
  }

  return null;
}

/**
 * Apply auto-corrections for common LLM mistakes
 */
function autoCorrect(data: EnrichmentData): EnrichmentData {
  const corrections: Record<string, string> = {
    // crowd_level
    crowded: 'busy',
    light: 'quiet',
    heavy: 'packed',
    low: 'quiet',
    high: 'busy',
    medium: 'moderate',
    // access_difficulty
    easy: 'short_walk',
    hard: 'difficult_hike',
    moderate: 'moderate_hike',
  };

  const result = { ...data };

  // Fix crowd_level with logging
  if (result.crowd_level && corrections[result.crowd_level]) {
    log.debug(`Auto-correcting crowd_level: ${result.crowd_level} -> ${corrections[result.crowd_level]}`);
    result.crowd_level = corrections[result.crowd_level] as EnrichmentData['crowd_level'];
  }

  // Validate enums
  const validCrowdLevels = ['empty', 'quiet', 'moderate', 'busy', 'packed'];
  if (result.crowd_level && !validCrowdLevels.includes(result.crowd_level)) {
    log.debug(`Invalid crowd_level "${result.crowd_level}", setting to null`);
    result.crowd_level = null;
  }

  const validAccess = ['drive_up', 'short_walk', 'moderate_hike', 'difficult_hike'];
  if (result.access_difficulty && !validAccess.includes(result.access_difficulty)) {
    log.debug(`Invalid access_difficulty "${result.access_difficulty}", setting to null`);
    result.access_difficulty = null;
  }

  const validParking = ['ample', 'limited', 'very_limited', 'roadside', 'trailhead'];
  if (result.parking && !validParking.includes(result.parking)) {
    log.debug(`Invalid parking "${result.parking}", setting to null`);
    result.parking = null;
  }

  const validCellService = ['full', 'partial', 'none', 'unknown'];
  if (result.cell_service && !validCellService.includes(result.cell_service)) {
    result.cell_service = null;
  }

  const validFeeType = ['free', 'paid', 'donation', 'unknown'];
  if (result.fee_type && !validFeeType.includes(result.fee_type)) {
    result.fee_type = null;
  }

  const validBestSeason = ['spring', 'summer', 'fall', 'winter', 'year_round'];
  if (result.best_season && !validBestSeason.includes(result.best_season)) {
    result.best_season = null;
  }

  const validClothingOptional = ['yes', 'no', 'unofficial', 'unknown'];
  if (result.clothing_optional && !validClothingOptional.includes(result.clothing_optional)) {
    result.clothing_optional = null;
  }

  const validExperience = ['resort', 'primitive', 'hybrid'];
  if (result.experience_type && !validExperience.includes(result.experience_type)) {
    result.experience_type = undefined;
  }

  const validConfidence = ['high', 'medium', 'low'];
  if (result.confidence && !validConfidence.includes(result.confidence)) {
    result.confidence = 'low';
  }

  // Validate numeric ranges
  if (result.temp_f !== null && result.temp_f !== undefined) {
    if (result.temp_f < 32 || result.temp_f > 212) {
      result.temp_f = null;
    }
  }

  if (result.time_from_parking_min !== null && result.time_from_parking_min !== undefined) {
    if (result.time_from_parking_min < 0 || result.time_from_parking_min > 480) {
      result.time_from_parking_min = null;
    }
  }

  if (result.fee_amount_usd !== null && result.fee_amount_usd !== undefined) {
    if (result.fee_amount_usd < 0 || result.fee_amount_usd > 500) {
      result.fee_amount_usd = null;
    }
  }

  if (result.pool_count !== null && result.pool_count !== undefined) {
    if (result.pool_count < 1 || result.pool_count > 50) {
      result.pool_count = null;
    }
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 50;
  const stateIdx = args.indexOf('--state');
  const stateFilter = stateIdx >= 0 ? args[stateIdx + 1]?.toUpperCase() : undefined;

  log.info('Starting enrichment');
  if (dryRun) log.warn('DRY RUN MODE - no data will be updated');
  log.info(`Processing up to ${limit} springs`);
  if (stateFilter) log.info(`Filtering by state: ${stateFilter}`);

  // Check API keys
  if (!config.openai.apiKey) {
    log.error('OPENAI_API_KEY not set');
    process.exit(1);
  }
  if (!config.tavily.apiKey) {
    log.warn('TAVILY_API_KEY not set - will skip web search');
  }

  // Fetch pending springs
  let query = supabase
    .from('springs')
    .select('id, name, state, description, spring_type, experience_type')
    .eq('enrichment_status', 'pending')
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
    log.info('No pending springs to enrich');
    return;
  }

  log.info(`Found ${springs.length} springs to enrich`);

  let enriched = 0;
  let errors = 0;

  for (let i = 0; i < springs.length; i++) {
    const spring = springs[i];
    log.progress(i + 1, springs.length, `Enriching: ${spring.name}`);

    try {
      // Search for additional info
      const snippets = await searchTavily(spring.name, spring.state);
      await sleep(config.rateLimit.tavily);

      // Extract structured data
      let enrichmentData = await extractWithLLM(
        spring.name,
        spring.state,
        spring.description || '',
        snippets
      );
      await sleep(config.rateLimit.openai);

      if (!enrichmentData) {
        log.warn(`No enrichment data for ${spring.name}`);
        errors++;
        continue;
      }

      // Apply auto-corrections
      enrichmentData = autoCorrect(enrichmentData);

      if (dryRun) {
        log.info(`[DRY RUN] Would update ${spring.name}:`, enrichmentData);
        enriched++;
        continue;
      }

      // Update spring record
      const updateData: Record<string, unknown> = {
        enrichment_status: 'enriched',
        updated_at: new Date().toISOString(),
      };

      // Only update non-null fields
      if (enrichmentData.temp_f !== null && enrichmentData.temp_f !== undefined) {
        updateData.temp_f = enrichmentData.temp_f;
      }
      if (enrichmentData.access_difficulty) {
        updateData.access_difficulty = enrichmentData.access_difficulty;
      }
      if (enrichmentData.parking) {
        updateData.parking = enrichmentData.parking;
      }
      if (enrichmentData.time_from_parking_min !== null && enrichmentData.time_from_parking_min !== undefined) {
        updateData.time_from_parking_min = enrichmentData.time_from_parking_min;
      }
      if (enrichmentData.cell_service) {
        updateData.cell_service = enrichmentData.cell_service;
      }
      if (enrichmentData.fee_type) {
        updateData.fee_type = enrichmentData.fee_type;
      }
      if (enrichmentData.fee_amount_usd !== null && enrichmentData.fee_amount_usd !== undefined) {
        updateData.fee_amount_usd = enrichmentData.fee_amount_usd;
      }
      if (enrichmentData.crowd_level) {
        updateData.crowd_level = enrichmentData.crowd_level;
      }
      if (enrichmentData.best_season) {
        updateData.best_season = enrichmentData.best_season;
      }
      if (enrichmentData.clothing_optional) {
        updateData.clothing_optional = enrichmentData.clothing_optional;
      }
      if (enrichmentData.pool_count !== null && enrichmentData.pool_count !== undefined) {
        updateData.pool_count = enrichmentData.pool_count;
      }
      if (enrichmentData.experience_type) {
        updateData.experience_type = enrichmentData.experience_type;
      }
      if (enrichmentData.description && enrichmentData.description.length > (spring.description?.length || 0)) {
        updateData.description = enrichmentData.description;
      }
      if (enrichmentData.confidence) {
        updateData.confidence = enrichmentData.confidence;
      }

      const { error: updateError } = await supabase
        .from('springs')
        .update(updateData)
        .eq('id', spring.id);

      if (updateError) {
        log.error(`Failed to update ${spring.name}: ${updateError.message}`);
        errors++;
      } else {
        enriched++;
      }
    } catch (err) {
      log.error(`Error enriching ${spring.name}: ${err}`);
      errors++;
    }
  }

  log.done(`Enriched ${enriched} springs (${errors} errors)`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
