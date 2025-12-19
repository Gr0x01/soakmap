import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { env } from '@/lib/env';
import type { Database } from '@/types/database';
import type { Spring, SpringSummary, State, NearbySpring, SpringFilters } from '@/types';

// =============================================================================
// Result Type for Error Handling
// =============================================================================

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// =============================================================================
// Utilities
// =============================================================================

/**
 * Escape SQL LIKE/ILIKE wildcards to prevent injection
 */
function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * Clamp a number within bounds
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// =============================================================================
// Supabase Client - Fresh instance per request for Server Components
// =============================================================================

function createSupabaseClient() {
  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Export for direct access when needed
export { createSupabaseClient as supabase };

// =============================================================================
// Database Queries (with React cache for request deduplication)
// =============================================================================

// Pagination limits
const MAX_LIMIT = 100;
const MAX_OFFSET = 10000;
const DEFAULT_LIMIT = 20;

export const db = {
  /**
   * Get all springs with optional filters
   */
  getSprings: cache(async (filters?: SpringFilters): Promise<Result<SpringSummary[]>> => {
    const supabase = createSupabaseClient();

    let query = supabase
      .from('springs')
      .select('id, name, slug, state, lat, lng, spring_type, experience_type, photo_url')
      .order('name');

    if (filters?.state) {
      query = query.eq('state', filters.state.toUpperCase());
    }
    if (filters?.spring_type) {
      query = query.eq('spring_type', filters.spring_type);
    }
    if (filters?.experience_type) {
      query = query.eq('experience_type', filters.experience_type);
    }
    if (filters?.q) {
      // Escape SQL wildcards to prevent injection
      const sanitized = escapeLikePattern(filters.q);
      query = query.ilike('name', `%${sanitized}%`);
    }

    // Apply pagination with safety limits
    const limit = clamp(filters?.limit || DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clamp(filters?.offset || 0, 0, MAX_OFFSET);

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching springs:', error);
      return { ok: false, error: `Database error: ${error.message}` };
    }

    return { ok: true, data: (data as SpringSummary[]) || [] };
  }),

  /**
   * Get a single spring by slug
   */
  getSpringBySlug: cache(async (slug: string): Promise<Result<Spring | null>> => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('springs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is not an error for us
      if (error.code === 'PGRST116') {
        return { ok: true, data: null };
      }
      console.error('Error fetching spring:', error);
      return { ok: false, error: `Database error: ${error.message}` };
    }

    return { ok: true, data: data as Spring };
  }),

  /**
   * Get all spring slugs (for static generation)
   */
  getSpringSlugs: cache(async (): Promise<Result<{ slug: string }[]>> => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('springs')
      .select('slug');

    if (error) {
      console.error('Error fetching slugs:', error);
      return { ok: false, error: `Database error: ${error.message}` };
    }

    return { ok: true, data: (data as { slug: string }[]) || [] };
  }),

  /**
   * Get all states with spring counts
   */
  getStates: cache(async (): Promise<Result<State[]>> => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('states')
      .select('*')
      .gt('spring_count', 0)
      .order('name');

    if (error) {
      console.error('Error fetching states:', error);
      return { ok: false, error: `Database error: ${error.message}` };
    }

    return { ok: true, data: (data as State[]) || [] };
  }),

  /**
   * Get a single state by code
   */
  getStateByCode: cache(async (code: string): Promise<Result<State | null>> => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('states')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { ok: true, data: null };
      }
      console.error('Error fetching state:', error);
      return { ok: false, error: `Database error: ${error.message}` };
    }

    return { ok: true, data: data as State };
  }),

  /**
   * Get springs in a specific state
   */
  getSpringsByState: cache(async (stateCode: string): Promise<Result<SpringSummary[]>> => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('springs')
      .select('id, name, slug, state, lat, lng, spring_type, experience_type, photo_url')
      .eq('state', stateCode.toUpperCase())
      .order('name');

    if (error) {
      console.error('Error fetching springs by state:', error);
      return { ok: false, error: `Database error: ${error.message}` };
    }

    return { ok: true, data: (data as SpringSummary[]) || [] };
  }),

  /**
   * Find springs near a location using PostGIS
   */
  getNearby: cache(async (lat: number, lng: number, radiusMiles = 50, limit = 10): Promise<Result<NearbySpring[]>> => {
    const supabase = createSupabaseClient();

    // Validate and clamp inputs
    const safeLat = clamp(lat, -90, 90);
    const safeLng = clamp(lng, -180, 180);
    const safeRadius = clamp(radiusMiles, 1, 500);
    const safeLimit = clamp(limit, 1, 50);

    const { data, error } = await supabase.rpc('nearby_springs', {
      lat: safeLat,
      lng: safeLng,
      radius_miles: safeRadius,
      max_results: safeLimit,
    });

    if (error) {
      console.error('Error fetching nearby springs:', error);
      return { ok: false, error: `Database error: ${error.message}` };
    }

    return { ok: true, data: (data as NearbySpring[]) || [] };
  }),

  /**
   * Get featured springs - prioritizes springs with photos and high confidence,
   * but falls back to any springs if none match
   */
  getFeaturedSprings: cache(async (limit = 6): Promise<Result<SpringSummary[]>> => {
    const supabase = createSupabaseClient();

    const safeLimit = clamp(limit, 1, 20);

    // First try: springs with photos and high confidence
    let { data, error } = await supabase
      .from('springs')
      .select('id, name, slug, state, lat, lng, spring_type, experience_type, photo_url')
      .not('photo_url', 'is', null)
      .eq('confidence', 'high')
      .limit(safeLimit);

    if (error) {
      console.error('Error fetching featured springs:', error);
      return { ok: false, error: `Database error: ${error.message}` };
    }

    // Fallback: if not enough springs with photos, get a diverse mix
    if (!data || data.length < safeLimit) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('springs')
        .select('id, name, slug, state, lat, lng, spring_type, experience_type, photo_url')
        .order('name')
        .limit(safeLimit);

      if (fallbackError) {
        console.error('Error fetching fallback springs:', fallbackError);
        return { ok: false, error: `Database error: ${fallbackError.message}` };
      }

      data = fallbackData;
    }

    return { ok: true, data: (data as SpringSummary[]) || [] };
  }),

  /**
   * Get stats for homepage - uses states table aggregation for efficiency
   */
  getStats: cache(async (): Promise<Result<{ total: number; hot: number; warm: number; cold: number }>> => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('states')
      .select('spring_count, hot_count, warm_count, cold_count');

    if (error) {
      console.error('Error fetching stats:', error);
      return { ok: false, error: `Database error: ${error.message}` };
    }

    // Aggregate from states table - much more efficient than counting all springs
    const stats = (data || []).reduce(
      (acc, state) => ({
        total: acc.total + (state.spring_count || 0),
        hot: acc.hot + (state.hot_count || 0),
        warm: acc.warm + (state.warm_count || 0),
        cold: acc.cold + (state.cold_count || 0),
      }),
      { total: 0, hot: 0, warm: 0, cold: 0 }
    );

    return { ok: true, data: stats };
  }),
};
