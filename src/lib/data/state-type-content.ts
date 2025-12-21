/**
 * Content templates for state + type combination pages
 */

export type FilterType = 'hot-springs' | 'warm-springs' | 'swimming-holes';

/**
 * Map filter slug to spring_type enum
 */
export function getSpringTypeFromFilter(filter: FilterType): 'hot' | 'warm' | 'cold' {
  switch (filter) {
    case 'hot-springs':
      return 'hot';
    case 'warm-springs':
      return 'warm';
    case 'swimming-holes':
      return 'cold';
  }
}

/**
 * Get readable label for filter type
 */
export function getFilterLabel(filter: FilterType): string {
  switch (filter) {
    case 'hot-springs':
      return 'Hot Springs';
    case 'warm-springs':
      return 'Warm Springs';
    case 'swimming-holes':
      return 'Swimming Holes';
  }
}

/**
 * Generate page title for state + type combo
 */
export function getStateTypeTitle(stateName: string, filter: FilterType): string {
  const label = getFilterLabel(filter);
  return `${label} in ${stateName}`;
}

/**
 * Generate intro paragraph for state + type combo page
 */
export function getStateTypeIntro(stateName: string, filter: FilterType, count: number): string {

  switch (filter) {
    case 'hot-springs':
      return `Discover ${count} natural hot springs in ${stateName}. From primitive wilderness soaks to resort-style amenities, find geothermal springs with detailed access info, temperature data, and crowd levels. Perfect for year-round soaking adventures.`;

    case 'warm-springs':
      return `Explore ${count} warm springs in ${stateName}. These temperate springs offer comfortable year-round swimming and soaking. Find detailed access information, amenities, and seasonal recommendations for each location.`;

    case 'swimming-holes':
      return `Find ${count} swimming holes in ${stateName}. Discover pristine cold-water pools, waterfalls, and natural swimming areas. Get details on depth, cliff jumping, rope swings, and kid-friendly spots for refreshing summer adventures.`;
  }
}

/**
 * Get all valid filter types
 */
export const FILTER_TYPES: FilterType[] = ['hot-springs', 'warm-springs', 'swimming-holes'];

/**
 * Check if a string is a valid filter type
 */
export function isValidFilterType(filter: string): filter is FilterType {
  return FILTER_TYPES.includes(filter as FilterType);
}
