/**
 * Data abstraction layer for springs.
 *
 * This module tries Supabase first, falling back to mock data when the database
 * is empty or unavailable. Components should ONLY import from this file.
 */

import { db } from '@/lib/supabase';
import { MOCK_SPRINGS } from './mock-springs';
import type { Spring, SpringSummary, SpringFilters } from '@/types/spring';

/**
 * Get all springs with optional filters.
 * Tries Supabase first, falls back to mock data.
 */
export async function getSprings(filters?: SpringFilters): Promise<SpringSummary[]> {
  // Try Supabase first
  const result = await db.getSprings(filters);

  if (result.ok && result.data.length > 0) {
    return result.data;
  }

  // Fall back to mock data
  let results = [...MOCK_SPRINGS];

  if (filters?.spring_type) {
    results = results.filter((s) => s.spring_type === filters.spring_type);
  }

  if (filters?.experience_type) {
    results = results.filter((s) => s.experience_type === filters.experience_type);
  }

  if (filters?.state) {
    results = results.filter((s) => s.state === filters.state);
  }

  if (filters?.q) {
    const query = filters.q.toLowerCase();
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.state.toLowerCase().includes(query)
    );
  }

  // Apply pagination
  const offset = filters?.offset ?? 0;
  const limit = filters?.limit ?? results.length;
  results = results.slice(offset, offset + limit);

  return results.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    state: s.state,
    lat: s.lat,
    lng: s.lng,
    spring_type: s.spring_type,
    experience_type: s.experience_type,
    photo_url: s.photo_url,
    temp_f: s.temp_f ?? null,
    access_difficulty: s.access_difficulty ?? null,
    parking: s.parking ?? null,
    fee_type: s.fee_type ?? null,
  }));
}

/**
 * Get featured springs for homepage.
 * Tries Supabase first, falls back to mock data.
 */
export async function getFeaturedSprings(limit = 6): Promise<SpringSummary[]> {
  // Try Supabase first
  const result = await db.getFeaturedSprings(limit);

  if (result.ok && result.data.length > 0) {
    return result.data;
  }

  // Fall back to mock data
  const featured = MOCK_SPRINGS.slice(0, limit);

  return featured.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    state: s.state,
    lat: s.lat,
    lng: s.lng,
    spring_type: s.spring_type,
    experience_type: s.experience_type,
    photo_url: s.photo_url,
    temp_f: s.temp_f ?? null,
    access_difficulty: s.access_difficulty ?? null,
    parking: s.parking ?? null,
    fee_type: s.fee_type ?? null,
  }));
}

/**
 * Get a single spring by slug.
 * Tries Supabase first, falls back to mock data.
 */
export async function getSpringBySlug(slug: string): Promise<Spring | null> {
  // Try Supabase first
  const result = await db.getSpringBySlug(slug);

  if (result.ok && result.data) {
    return result.data;
  }

  // Fall back to mock data
  return MOCK_SPRINGS.find((s) => s.slug === slug) ?? null;
}

/**
 * Get a single spring by ID.
 */
export async function getSpringById(id: string): Promise<Spring | null> {
  return MOCK_SPRINGS.find((s) => s.id === id) ?? null;
}

/**
 * Get count of springs by type.
 * Tries Supabase first, falls back to mock data.
 */
export async function getSpringCounts(): Promise<{
  total: number;
  hot: number;
  warm: number;
  cold: number;
}> {
  // Try Supabase first
  const result = await db.getStats();

  if (result.ok && result.data.total > 0) {
    return result.data;
  }

  // Fall back to mock data
  return {
    total: MOCK_SPRINGS.length,
    hot: MOCK_SPRINGS.filter((s) => s.spring_type === 'hot').length,
    warm: MOCK_SPRINGS.filter((s) => s.spring_type === 'warm').length,
    cold: MOCK_SPRINGS.filter((s) => s.spring_type === 'cold').length,
  };
}

/**
 * Get unique states that have springs.
 */
export async function getStatesWithSprings(): Promise<string[]> {
  const states = new Set(MOCK_SPRINGS.map((s) => s.state));
  return Array.from(states).sort();
}

/**
 * Get springs by state.
 */
export async function getSpringsByState(state: string): Promise<SpringSummary[]> {
  return getSprings({ state });
}

/**
 * Get all spring slugs (for static generation).
 */
export async function getAllSpringSlugs(): Promise<string[]> {
  // Try Supabase first
  const result = await db.getSpringSlugs();

  if (result.ok && result.data.length > 0) {
    return result.data.map((s) => s.slug);
  }

  // Fall back to mock data
  return MOCK_SPRINGS.map((s) => s.slug);
}
