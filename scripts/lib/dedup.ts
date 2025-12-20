/**
 * Deduplication utilities for spring data
 *
 * Two modes:
 * 1. Pre-insert check: Look up existing springs to avoid inserting duplicates
 * 2. Post-import cleanup: Find and merge duplicates in the database
 *
 * IMPORTANT: This module uses an in-memory cache designed for single-run import
 * scripts only. Do not use in long-running processes (servers) without implementing
 * cache expiration, as data will become stale.
 */

import { supabase } from './supabase';

// ~500m in degrees for proximity matching (0.01 = ~1km was too aggressive)
const PROXIMITY_THRESHOLD = 0.005;

/**
 * Normalize name for comparison
 * - Lowercase
 * - Remove common suffixes (Hot Springs, Spring, etc.)
 * - Remove punctuation
 * - Collapse whitespace
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(hot\s+)?springs?$/i, '')
    .replace(/\s+area$/i, '')
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Check if two normalized names are similar enough to be potential duplicates
 * Requires stronger matching for multi-word names to avoid false positives
 */
function areNamesSimilar(nameA: string, nameB: string): boolean {
  const wordsA = new Set(nameA.split(' ').filter((w) => w.length > 2));
  const wordsB = new Set(nameB.split(' ').filter((w) => w.length > 2));

  // Count common significant words
  let commonWords = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) commonWords++;
  }

  const minWords = Math.min(wordsA.size, wordsB.size);

  // For names with 2+ significant words, require at least 50% overlap
  if (minWords >= 2) {
    return commonWords >= Math.ceil(minWords * 0.5);
  }

  // For single-word names, require exact match of that word
  return commonWords === 1 && wordsA.size === 1 && wordsB.size === 1;
}

/**
 * Check if two springs are likely duplicates
 * - Same normalized name in same state, OR
 * - Very close coordinates AND similar names (to avoid false positives)
 */
export function areLikelyDuplicates(
  a: { name: string; state: string; lat: number; lng: number },
  b: { name: string; state: string; lat: number; lng: number }
): boolean {
  const normA = normalizeName(a.name);
  const normB = normalizeName(b.name);

  // Same normalized name in same state
  if (a.state === b.state && normA === normB) {
    return true;
  }

  // Very close coordinates AND similar names (avoid grouping unrelated nearby springs)
  const latDiff = Math.abs(a.lat - b.lat);
  const lngDiff = Math.abs(a.lng - b.lng);
  if (latDiff < PROXIMITY_THRESHOLD && lngDiff < PROXIMITY_THRESHOLD) {
    // Only consider proximity duplicates if names are similar
    if (areNamesSimilar(normA, normB)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate a "richness" score for a spring record
 * Higher score = more data = better candidate to keep
 */
export function calculateRichnessScore(spring: Record<string, unknown>): number {
  let score = 0;

  // Core data
  if (spring.description && (spring.description as string).length > 50) score += 2;
  if (spring.temp_f) score += 2;
  if (spring.photo_url) score += 3;

  // Enriched fields
  if (spring.access_difficulty && spring.access_difficulty !== 'unknown') score += 1;
  if (spring.parking && spring.parking !== 'unknown') score += 1;
  if (spring.fee_type && spring.fee_type !== 'unknown') score += 1;
  if (spring.clothing_optional && spring.clothing_optional !== 'unknown') score += 1;
  if (spring.cell_service && spring.cell_service !== 'unknown') score += 1;
  if (spring.crowd_level && spring.crowd_level !== 'unknown') score += 1;
  if (spring.best_season && spring.best_season !== 'unknown') score += 1;

  // Directions and warnings
  if (spring.directions && (spring.directions as string).length > 20) score += 1;
  if (spring.safety_notes && (spring.safety_notes as string).length > 10) score += 1;

  // Source preference (GNIS is authoritative for names/coords)
  if (spring.source === 'gnis') score += 1;
  if (spring.enrichment_status === 'complete') score += 2;

  return score;
}

interface ExistingSpring {
  id: string;
  name: string;
  slug: string;
  state: string;
  lat: number;
  lng: number;
}

// Cache for existing springs to avoid repeated DB queries
let springCache: ExistingSpring[] | null = null;

/**
 * Load all existing springs into memory for fast duplicate checking
 * Call this once before processing a batch of new springs
 */
export async function loadExistingSprings(): Promise<ExistingSpring[]> {
  if (springCache) return springCache;

  const allSprings: ExistingSpring[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('springs')
      .select('id, name, slug, state, lat, lng')
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to load springs: ${error.message}`);
    if (!data || data.length === 0) break;

    allSprings.push(...data);
    offset += limit;
    if (data.length < limit) break;
  }

  springCache = allSprings;
  return allSprings;
}

/**
 * Clear the spring cache (call after inserts to refresh)
 */
export function clearSpringCache(): void {
  springCache = null;
}

/**
 * Check if a spring already exists in the database
 * Returns the existing spring if found, null otherwise
 */
export async function findExistingSpring(
  name: string,
  state: string,
  lat: number,
  lng: number
): Promise<ExistingSpring | null> {
  const existing = await loadExistingSprings();

  for (const spring of existing) {
    if (areLikelyDuplicates(
      { name, state, lat, lng },
      { name: spring.name, state: spring.state, lat: spring.lat, lng: spring.lng }
    )) {
      return spring;
    }
  }

  return null;
}

/**
 * Filter out springs that already exist in the database
 * Returns only the new springs that should be inserted
 */
export async function filterNewSprings<T extends { name: string; state: string; lat: number; lng: number }>(
  springs: T[]
): Promise<{ new: T[]; duplicates: Array<{ spring: T; existingId: string }> }> {
  const existing = await loadExistingSprings();

  // Build grid index for fast proximity lookup
  const grid = new Map<string, ExistingSpring[]>();
  for (const spring of existing) {
    const cellKey = `${Math.floor(spring.lat / PROXIMITY_THRESHOLD)},${Math.floor(spring.lng / PROXIMITY_THRESHOLD)}`;
    if (!grid.has(cellKey)) grid.set(cellKey, []);
    grid.get(cellKey)!.push(spring);
  }

  // Also index by normalized name + state for name matching
  const nameIndex = new Map<string, ExistingSpring[]>();
  for (const spring of existing) {
    const key = `${normalizeName(spring.name)}:${spring.state}`;
    if (!nameIndex.has(key)) nameIndex.set(key, []);
    nameIndex.get(key)!.push(spring);
  }

  const newSprings: T[] = [];
  const duplicates: Array<{ spring: T; existingId: string }> = [];

  for (const spring of springs) {
    let foundDupe: ExistingSpring | null = null;

    // Check name index first (faster)
    const nameKey = `${normalizeName(spring.name)}:${spring.state}`;
    const nameMatches = nameIndex.get(nameKey) || [];
    if (nameMatches.length > 0) {
      foundDupe = nameMatches[0];
    }

    // Check proximity if no name match
    if (!foundDupe) {
      const cellKey = `${Math.floor(spring.lat / PROXIMITY_THRESHOLD)},${Math.floor(spring.lng / PROXIMITY_THRESHOLD)}`;
      const nearby = grid.get(cellKey) || [];
      for (const existing of nearby) {
        if (areLikelyDuplicates(spring, existing)) {
          foundDupe = existing;
          break;
        }
      }
    }

    if (foundDupe) {
      duplicates.push({ spring, existingId: foundDupe.id });
    } else {
      newSprings.push(spring);
    }
  }

  return { new: newSprings, duplicates };
}

export interface DuplicateGroup {
  springs: Array<{
    id: string;
    name: string;
    slug: string;
    state: string;
    lat: number;
    lng: number;
    score: number;
  }>;
  keepId: string;
  deleteIds: string[];
}

/**
 * Find all duplicate groups in the database
 * Returns groups with the best spring to keep and others to delete
 */
export async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  // Fetch all springs with full data for scoring
  const { data: allSprings, error } = await supabase
    .from('springs')
    .select('*');

  if (error) throw new Error(`Failed to fetch springs: ${error.message}`);
  if (!allSprings) return [];

  // Build grid index
  const grid = new Map<string, typeof allSprings>();
  for (const spring of allSprings) {
    const cellKey = `${Math.floor(spring.lat / PROXIMITY_THRESHOLD)},${Math.floor(spring.lng / PROXIMITY_THRESHOLD)}`;
    if (!grid.has(cellKey)) grid.set(cellKey, []);
    grid.get(cellKey)!.push(spring);
  }

  const duplicateGroups: DuplicateGroup[] = [];
  const processedIds = new Set<string>();

  for (const spring of allSprings) {
    if (processedIds.has(spring.id)) continue;

    const group: typeof allSprings = [spring];
    processedIds.add(spring.id);

    // Check same cell and adjacent cells for duplicates
    const cellX = Math.floor(spring.lat / PROXIMITY_THRESHOLD);
    const cellY = Math.floor(spring.lng / PROXIMITY_THRESHOLD);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborKey = `${cellX + dx},${cellY + dy}`;
        const neighbors = grid.get(neighborKey) || [];

        for (const neighbor of neighbors) {
          if (processedIds.has(neighbor.id)) continue;
          if (areLikelyDuplicates(spring, neighbor)) {
            group.push(neighbor);
            processedIds.add(neighbor.id);
          }
        }
      }
    }

    if (group.length > 1) {
      // Calculate scores and determine which to keep
      const scored = group.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        state: s.state,
        lat: s.lat,
        lng: s.lng,
        score: calculateRichnessScore(s as Record<string, unknown>),
      }));

      scored.sort((a, b) => b.score - a.score);

      duplicateGroups.push({
        springs: scored,
        keepId: scored[0].id,
        deleteIds: scored.slice(1).map((s) => s.id),
      });
    }
  }

  return duplicateGroups;
}

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Merge and delete duplicate springs
 * Keeps the richest spring and deletes the rest
 * Returns count of deleted springs
 */
export async function mergeDuplicates(groups: DuplicateGroup[]): Promise<number> {
  let deleted = 0;

  for (const group of groups) {
    if (group.deleteIds.length === 0) continue;

    // Validate all IDs are valid UUIDs to prevent accidental data loss
    const invalidIds = group.deleteIds.filter((id) => !UUID_REGEX.test(id));
    if (invalidIds.length > 0) {
      console.error(`Invalid UUID(s) in delete list for "${group.springs[0].name}": ${invalidIds.join(', ')}`);
      continue;
    }

    const { error } = await supabase
      .from('springs')
      .delete()
      .in('id', group.deleteIds);

    if (error) {
      console.error(`Failed to delete duplicates for ${group.springs[0].name}: ${error.message}`);
    } else {
      deleted += group.deleteIds.length;
    }
  }

  // Clear cache after deletions
  clearSpringCache();

  return deleted;
}
