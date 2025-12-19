/**
 * Zod schemas for spring data validation
 * Matches database enums exactly
 */
import { z } from 'zod';

// Database enum types
export const springTypeEnum = z.enum(['hot', 'warm', 'cold']);
export const experienceTypeEnum = z.enum(['resort', 'primitive', 'hybrid']);
export const accessDifficultyEnum = z.enum(['drive_up', 'short_walk', 'moderate_hike', 'difficult_hike']);
export const parkingTypeEnum = z.enum(['ample', 'limited', 'very_limited', 'roadside', 'trailhead']);
export const cellServiceEnum = z.enum(['full', 'partial', 'none', 'unknown']);
export const feeTypeEnum = z.enum(['free', 'paid', 'donation', 'unknown']);
export const crowdLevelEnum = z.enum(['empty', 'quiet', 'moderate', 'busy', 'packed']);
export const bestSeasonEnum = z.enum(['spring', 'summer', 'fall', 'winter', 'year_round']);
export const clothingOptionalEnum = z.enum(['yes', 'no', 'unofficial', 'unknown']);
export const confidenceEnum = z.enum(['high', 'medium', 'low']);
export const warningTypeEnum = z.enum([
  'strong_current',
  'cold_shock',
  'high_temperature',
  'cliff_edges',
  'no_lifeguard',
  'wildlife_bears',
  'wildlife_snakes',
  'remote_no_help',
  'seasonal_closure',
  'flash_flood_risk',
  'slippery_rocks',
]);

// US state codes
export const stateCodeEnum = z.enum([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]);

// Spring validation schema
export const springSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  state: stateCodeEnum,
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  spring_type: springTypeEnum,
  experience_type: experienceTypeEnum,
  description: z.string().min(1).max(2000),

  // Optional fields
  temp_f: z.number().int().min(32).max(212).nullable().optional(),
  access_difficulty: accessDifficultyEnum.nullable().optional(),
  parking: parkingTypeEnum.nullable().optional(),
  time_from_parking_min: z.number().int().min(0).max(480).nullable().optional(),
  cell_service: cellServiceEnum.nullable().optional(),
  fee_type: feeTypeEnum.nullable().optional(),
  fee_amount_usd: z.number().min(0).max(500).nullable().optional(),
  crowd_level: crowdLevelEnum.nullable().optional(),
  best_season: bestSeasonEnum.nullable().optional(),
  best_time: z.string().max(100).nullable().optional(),
  clothing_optional: clothingOptionalEnum.nullable().optional(),
  sulfur_smell: z.string().max(50).nullable().optional(),
  pool_count: z.number().int().min(1).max(50).nullable().optional(),
  depth: z.string().max(50).nullable().optional(),
  water_clarity: z.string().max(50).nullable().optional(),
  cliff_jumping: z.boolean().nullable().optional(),
  cliff_heights_ft: z.array(z.number().int()).nullable().optional(),
  rope_swing: z.boolean().nullable().optional(),
  waterfall: z.boolean().nullable().optional(),
  kid_friendly: z.string().max(50).nullable().optional(),
  warnings: z.array(warningTypeEnum).nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
  source: z.string().max(100).nullable().optional(),
  source_id: z.string().max(100).nullable().optional(),
  enrichment_status: z.string().max(50).nullable().optional(),
  confidence: confidenceEnum.nullable().optional(),
});

export type SpringInput = z.infer<typeof springSchema>;

// Validation result
export interface ValidationResult {
  valid: SpringInput[];
  invalid: Array<{ data: unknown; errors: z.ZodError }>;
}

export function validateSprings(data: unknown[]): ValidationResult {
  const valid: SpringInput[] = [];
  const invalid: Array<{ data: unknown; errors: z.ZodError }> = [];

  for (const item of data) {
    const result = springSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ data: item, errors: result.error });
    }
  }

  return { valid, invalid };
}
