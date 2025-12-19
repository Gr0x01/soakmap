/**
 * Supabase Database Types
 * Generated manually from supabase/schema.sql
 *
 * To regenerate from remote:
 * 1. Run: npx supabase login
 * 2. Run: npx supabase gen types typescript --project-id mrqmxspdxscigtjhxawz > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      springs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          state: string;
          location: unknown; // PostGIS geography type
          lat: number;
          lng: number;
          spring_type: Database['public']['Enums']['spring_type'];
          experience_type: Database['public']['Enums']['experience_type'];
          description: string;
          temp_f: number | null;
          access_difficulty: Database['public']['Enums']['access_difficulty'] | null;
          parking: Database['public']['Enums']['parking_type'] | null;
          time_from_parking_min: number | null;
          cell_service: Database['public']['Enums']['cell_service_type'] | null;
          fee_type: Database['public']['Enums']['fee_type'] | null;
          fee_amount_usd: number | null;
          crowd_level: Database['public']['Enums']['crowd_level'] | null;
          best_season: Database['public']['Enums']['best_season'] | null;
          best_time: Database['public']['Enums']['best_time'] | null;
          clothing_optional: Database['public']['Enums']['clothing_optional_type'] | null;
          sulfur_smell: string | null;
          pool_count: number | null;
          depth: string | null;
          water_clarity: string | null;
          cliff_jumping: boolean | null;
          cliff_heights_ft: number[] | null;
          rope_swing: boolean | null;
          waterfall: boolean | null;
          kid_friendly: string | null;
          warnings: Database['public']['Enums']['warning_type'][] | null;
          photo_url: string | null;
          source: string | null;
          source_id: string | null;
          enrichment_status: string | null;
          confidence: Database['public']['Enums']['confidence_level'] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          state: string;
          location: unknown;
          spring_type: Database['public']['Enums']['spring_type'];
          experience_type: Database['public']['Enums']['experience_type'];
          description: string;
          temp_f?: number | null;
          access_difficulty?: Database['public']['Enums']['access_difficulty'] | null;
          parking?: Database['public']['Enums']['parking_type'] | null;
          time_from_parking_min?: number | null;
          cell_service?: Database['public']['Enums']['cell_service_type'] | null;
          fee_type?: Database['public']['Enums']['fee_type'] | null;
          fee_amount_usd?: number | null;
          crowd_level?: Database['public']['Enums']['crowd_level'] | null;
          best_season?: Database['public']['Enums']['best_season'] | null;
          best_time?: Database['public']['Enums']['best_time'] | null;
          clothing_optional?: Database['public']['Enums']['clothing_optional_type'] | null;
          sulfur_smell?: string | null;
          pool_count?: number | null;
          depth?: string | null;
          water_clarity?: string | null;
          cliff_jumping?: boolean | null;
          cliff_heights_ft?: number[] | null;
          rope_swing?: boolean | null;
          waterfall?: boolean | null;
          kid_friendly?: string | null;
          warnings?: Database['public']['Enums']['warning_type'][] | null;
          photo_url?: string | null;
          source?: string | null;
          source_id?: string | null;
          enrichment_status?: string | null;
          confidence?: Database['public']['Enums']['confidence_level'] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          state?: string;
          location?: unknown;
          spring_type?: Database['public']['Enums']['spring_type'];
          experience_type?: Database['public']['Enums']['experience_type'];
          description?: string;
          temp_f?: number | null;
          access_difficulty?: Database['public']['Enums']['access_difficulty'] | null;
          parking?: Database['public']['Enums']['parking_type'] | null;
          time_from_parking_min?: number | null;
          cell_service?: Database['public']['Enums']['cell_service_type'] | null;
          fee_type?: Database['public']['Enums']['fee_type'] | null;
          fee_amount_usd?: number | null;
          crowd_level?: Database['public']['Enums']['crowd_level'] | null;
          best_season?: Database['public']['Enums']['best_season'] | null;
          best_time?: Database['public']['Enums']['best_time'] | null;
          clothing_optional?: Database['public']['Enums']['clothing_optional_type'] | null;
          sulfur_smell?: string | null;
          pool_count?: number | null;
          depth?: string | null;
          water_clarity?: string | null;
          cliff_jumping?: boolean | null;
          cliff_heights_ft?: number[] | null;
          rope_swing?: boolean | null;
          waterfall?: boolean | null;
          kid_friendly?: string | null;
          warnings?: Database['public']['Enums']['warning_type'][] | null;
          photo_url?: string | null;
          source?: string | null;
          source_id?: string | null;
          enrichment_status?: string | null;
          confidence?: Database['public']['Enums']['confidence_level'] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_springs_state';
            columns: ['state'];
            referencedRelation: 'states';
            referencedColumns: ['code'];
          }
        ];
      };
      states: {
        Row: {
          code: string;
          name: string;
          spring_count: number;
          hot_count: number;
          warm_count: number;
          cold_count: number;
        };
        Insert: {
          code: string;
          name: string;
          spring_count?: number;
          hot_count?: number;
          warm_count?: number;
          cold_count?: number;
        };
        Update: {
          code?: string;
          name?: string;
          spring_count?: number;
          hot_count?: number;
          warm_count?: number;
          cold_count?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      nearby_springs: {
        Args: {
          lat: number;
          lng: number;
          radius_miles?: number;
          max_results?: number;
        };
        Returns: {
          id: string;
          name: string;
          slug: string;
          state: string;
          spring_type: Database['public']['Enums']['spring_type'];
          experience_type: Database['public']['Enums']['experience_type'];
          distance_miles: number;
        }[];
      };
    };
    Enums: {
      spring_type: 'hot' | 'warm' | 'cold';
      experience_type: 'resort' | 'primitive' | 'hybrid';
      access_difficulty: 'drive_up' | 'short_walk' | 'moderate_hike' | 'difficult_hike';
      parking_type: 'ample' | 'limited' | 'very_limited' | 'roadside' | 'trailhead';
      cell_service_type: 'full' | 'partial' | 'none' | 'unknown';
      fee_type: 'free' | 'paid' | 'donation' | 'unknown';
      crowd_level: 'empty' | 'quiet' | 'moderate' | 'busy' | 'packed';
      best_season: 'spring' | 'summer' | 'fall' | 'winter' | 'year_round';
      best_time: 'weekday' | 'weekend' | 'early_morning' | 'evening' | 'any';
      clothing_optional_type: 'yes' | 'no' | 'unofficial' | 'unknown';
      confidence_level: 'high' | 'medium' | 'low';
      warning_type:
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
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
export type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T];
