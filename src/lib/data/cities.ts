/**
 * City helper functions for activity pairing pages
 */

import { SEED_CITIES, type SeedCity } from './seed-cities';

/**
 * Get city by URL slug (case-insensitive)
 */
export function getCityBySlug(slug: string): SeedCity | null {
  const normalized = slug.toLowerCase();
  return SEED_CITIES.find((city) => city.slug === normalized) || null;
}

/**
 * Get all city slugs for static generation
 */
export function getAllCitySlugs(): string[] {
  return SEED_CITIES.map((city) => city.slug);
}

/**
 * Get all cities
 */
export function getAllCities(): SeedCity[] {
  return SEED_CITIES;
}

// Re-export types
export type { SeedCity };
