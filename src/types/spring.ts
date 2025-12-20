/**
 * Spring data types matching the Supabase schema
 */

// Enum types
export type SpringType = 'hot' | 'warm' | 'cold';
export type ExperienceType = 'resort' | 'primitive' | 'hybrid';
export type AccessDifficulty = 'drive_up' | 'short_walk' | 'moderate_hike' | 'difficult_hike';
export type ParkingType = 'ample' | 'limited' | 'very_limited' | 'roadside' | 'trailhead';
export type CellServiceType = 'full' | 'partial' | 'none' | 'unknown';
export type FeeType = 'free' | 'paid' | 'donation' | 'unknown';
export type CrowdLevel = 'empty' | 'quiet' | 'moderate' | 'busy' | 'packed';
export type BestSeason = 'spring' | 'summer' | 'fall' | 'winter' | 'year_round';
export type BestTime = 'weekday' | 'weekend' | 'early_morning' | 'evening' | 'any';
export type ClothingOptionalType = 'yes' | 'no' | 'unofficial' | 'unknown';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type WarningType =
  | 'strong_current'
  | 'cold_shock'
  | 'high_temperature'
  | 'cliff_edges'
  | 'no_lifeguard'
  | 'wildlife_bears'
  | 'wildlife_snakes'
  | 'remote_no_help'
  | 'seasonal_closure'
  | 'flash_flood_risk'
  | 'slippery_rocks';

// Main Spring type
export interface Spring {
  // Identity
  id: string;
  name: string;
  slug: string;

  // Location
  state: string;
  lat: number;
  lng: number;

  // Classification (required)
  spring_type: SpringType;
  experience_type: ExperienceType;
  description: string;

  // Temperature
  temp_f: number | null;

  // Access & logistics (optional)
  access_difficulty: AccessDifficulty | null;
  parking: ParkingType | null;
  time_from_parking_min: number | null;
  cell_service: CellServiceType | null;
  fee_type: FeeType | null;
  fee_amount_usd: number | null;

  // Experience details (optional)
  crowd_level: CrowdLevel | null;
  best_season: BestSeason | null;
  best_time: BestTime | null;
  clothing_optional: ClothingOptionalType | null;

  // Hot spring specific
  sulfur_smell: string | null;
  pool_count: number | null;

  // Cold spring specific
  depth: string | null;
  water_clarity: string | null;
  cliff_jumping: boolean | null;
  cliff_heights_ft: number[] | null;
  rope_swing: boolean | null;
  waterfall: boolean | null;
  kid_friendly: string | null;

  // Warnings
  warnings: WarningType[] | null;

  // Media
  photo_url: string | null;

  // Pipeline tracking
  source: string | null;
  source_id: string | null;
  enrichment_status: string | null;
  confidence: ConfidenceLevel | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Lightweight spring for lists
export interface SpringSummary {
  id: string;
  name: string;
  slug: string;
  state: string;
  lat: number;
  lng: number;
  spring_type: SpringType;
  experience_type: ExperienceType;
  photo_url: string | null;
  // Practical info for card display
  temp_f: number | null;
  access_difficulty: AccessDifficulty | null;
  parking: ParkingType | null;
  fee_type: FeeType | null;
}

// State type
export interface State {
  code: string;
  name: string;
  spring_count: number;
  hot_count: number;
  warm_count: number;
  cold_count: number;
}

// Nearby spring result (from nearby_springs PostGIS function)
export interface NearbySpring {
  id: string;
  name: string;
  slug: string;
  state: string;
  spring_type: SpringType;
  experience_type: ExperienceType;
  distance_miles: number;
  lat: number;
  lng: number;
  photo_url: string | null;
  // Practical info for card display
  temp_f: number | null;
  access_difficulty: AccessDifficulty | null;
  parking: ParkingType | null;
  fee_type: FeeType | null;
}

// Filter parameters
export interface SpringFilters {
  state?: string;
  spring_type?: SpringType;
  experience_type?: ExperienceType;
  q?: string; // search query
  limit?: number;
  offset?: number;
}
