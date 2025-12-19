import type { SpringSummary, NearbySpring, SpringType, ExperienceType } from '@/types/spring';

type FilterableSpring = SpringSummary | NearbySpring;

/**
 * Filter springs by type and experience
 * Works with both SpringSummary and NearbySpring types
 */
export function filterSprings<T extends FilterableSpring>(
  springs: T[],
  springType?: SpringType,
  experienceType?: ExperienceType
): T[] {
  let filtered = springs;

  if (springType) {
    filtered = filtered.filter((s) => s.spring_type === springType);
  }

  if (experienceType) {
    filtered = filtered.filter((s) => s.experience_type === experienceType);
  }

  return filtered;
}
