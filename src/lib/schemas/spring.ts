import { z } from 'zod';

// =============================================================================
// Enum Schemas
// =============================================================================

export const springTypeSchema = z.enum(['hot', 'warm', 'cold']);
export const experienceTypeSchema = z.enum(['resort', 'primitive', 'hybrid']);
export const accessDifficultySchema = z.enum([
  'drive_up',
  'short_walk',
  'moderate_hike',
  'difficult_hike',
]);
export const parkingTypeSchema = z.enum([
  'ample',
  'limited',
  'very_limited',
  'roadside',
  'trailhead',
]);
export const cellServiceTypeSchema = z.enum(['full', 'partial', 'none', 'unknown']);
export const feeTypeSchema = z.enum(['free', 'paid', 'donation', 'unknown']);
export const crowdLevelSchema = z.enum(['empty', 'quiet', 'moderate', 'busy', 'packed']);
export const bestSeasonSchema = z.enum([
  'spring',
  'summer',
  'fall',
  'winter',
  'year_round',
]);
export const bestTimeSchema = z.enum([
  'weekday',
  'weekend',
  'early_morning',
  'evening',
  'any',
]);
export const clothingOptionalTypeSchema = z.enum(['yes', 'no', 'unofficial', 'unknown']);
export const confidenceLevelSchema = z.enum(['high', 'medium', 'low']);
export const warningTypeSchema = z.enum([
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

// =============================================================================
// Spring Schemas
// =============================================================================

export const springSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  state: z.string().length(2),
  lat: z.number(),
  lng: z.number(),
  spring_type: springTypeSchema,
  experience_type: experienceTypeSchema,
  description: z.string(),
  temp_f: z.number().nullable(),
  access_difficulty: accessDifficultySchema.nullable(),
  parking: parkingTypeSchema.nullable(),
  time_from_parking_min: z.number().nullable(),
  cell_service: cellServiceTypeSchema.nullable(),
  fee_type: feeTypeSchema.nullable(),
  fee_amount_usd: z.number().nullable(),
  crowd_level: crowdLevelSchema.nullable(),
  best_season: bestSeasonSchema.nullable(),
  best_time: bestTimeSchema.nullable(),
  clothing_optional: clothingOptionalTypeSchema.nullable(),
  sulfur_smell: z.string().nullable(),
  pool_count: z.number().nullable(),
  depth: z.string().nullable(),
  water_clarity: z.string().nullable(),
  cliff_jumping: z.boolean().nullable(),
  cliff_heights_ft: z.array(z.number()).nullable(),
  rope_swing: z.boolean().nullable(),
  waterfall: z.boolean().nullable(),
  kid_friendly: z.string().nullable(),
  warnings: z.array(warningTypeSchema).nullable(),
  photo_url: z.string().url().nullable(),
  source: z.string().nullable(),
  source_id: z.string().nullable(),
  enrichment_status: z.string().nullable(),
  confidence: confidenceLevelSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const springSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  state: z.string().length(2),
  lat: z.number(),
  lng: z.number(),
  spring_type: springTypeSchema,
  experience_type: experienceTypeSchema,
  photo_url: z.string().url().nullable(),
});

export const stateSchema = z.object({
  code: z.string().length(2),
  name: z.string(),
  spring_count: z.number(),
  hot_count: z.number(),
  warm_count: z.number(),
  cold_count: z.number(),
});

// =============================================================================
// Filter Schemas (for API validation)
// =============================================================================

export const springFiltersSchema = z.object({
  state: z.string().length(2).toUpperCase().optional(),
  spring_type: springTypeSchema.optional(),
  experience_type: experienceTypeSchema.optional(),
  q: z.string().max(200).optional(), // Limit search query length
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).max(10000).default(0), // Max offset to prevent abuse
});

export const nearbyParamsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(500).optional().default(50),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

// =============================================================================
// Type exports
// =============================================================================

export type SpringSchema = z.infer<typeof springSchema>;
export type SpringSummarySchema = z.infer<typeof springSummarySchema>;
export type StateSchema = z.infer<typeof stateSchema>;
export type SpringFiltersSchema = z.infer<typeof springFiltersSchema>;
export type NearbyParamsSchema = z.infer<typeof nearbyParamsSchema>;
