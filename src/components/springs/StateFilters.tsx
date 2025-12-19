'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { SpringType, ExperienceType } from '@/types/spring';

// Valid enum values for type safety
const VALID_SPRING_TYPES: SpringType[] = ['hot', 'warm', 'cold'];
const VALID_EXPERIENCE_TYPES: ExperienceType[] = ['resort', 'primitive', 'hybrid'];

// Validate and parse filter params
function parseSpringType(value: string | null): SpringType | null {
  if (value && VALID_SPRING_TYPES.includes(value as SpringType)) {
    return value as SpringType;
  }
  return null;
}

function parseExperienceType(value: string | null): ExperienceType | null {
  if (value && VALID_EXPERIENCE_TYPES.includes(value as ExperienceType)) {
    return value as ExperienceType;
  }
  return null;
}

interface StateFiltersProps {
  className?: string;
}

export function StateFilters({ className }: StateFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Validate params from URL
  const selectedType = parseSpringType(searchParams.get('type'));
  const selectedExperience = parseExperienceType(searchParams.get('experience'));

  const updateFilters = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const springTypes: { value: SpringType; label: string }[] = [
    { value: 'hot', label: 'Hot' },
    { value: 'warm', label: 'Warm' },
    { value: 'cold', label: 'Cold' },
  ];

  const experienceTypes: { value: ExperienceType; label: string }[] = [
    { value: 'resort', label: 'Resort' },
    { value: 'primitive', label: 'Primitive' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  const getTypeColor = (type: SpringType, isSelected: boolean): string => {
    if (!isSelected) return 'bg-cream text-forest border-forest/20 hover:border-forest/40';
    switch (type) {
      case 'hot':
        return 'bg-terracotta text-cream border-terracotta';
      case 'warm':
        return 'bg-moss text-cream border-moss';
      case 'cold':
        return 'bg-river text-cream border-river';
    }
  };

  return (
    <div
      className={cn('flex flex-wrap items-center gap-3', className)}
      role="group"
      aria-label="Filter springs"
    >
      {/* Temperature toggles */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by temperature type">
        <span className="text-sm text-bark/60 font-body mr-1" id="type-filter-label">Type:</span>
        {springTypes.map(({ value, label }) => {
          const isSelected = selectedType === value;
          return (
            <button
              key={value}
              onClick={() => updateFilters('type', isSelected ? null : value)}
              aria-pressed={isSelected}
              aria-label={`Filter by ${label.toLowerCase()} springs${isSelected ? ' (currently selected)' : ''}`}
              className={cn(
                'px-3 py-1.5 font-display text-sm font-semibold',
                'rounded-lg border transition-all duration-200',
                'hover-press shadow-soft focus-natural',
                getTypeColor(value, isSelected)
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <span className="w-px h-6 bg-forest/20 mx-1" aria-hidden="true" />

      {/* Experience toggles */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by experience type">
        <span className="text-sm text-bark/60 font-body mr-1" id="experience-filter-label">Experience:</span>
        {experienceTypes.map(({ value, label }) => {
          const isSelected = selectedExperience === value;
          return (
            <button
              key={value}
              onClick={() => updateFilters('experience', isSelected ? null : value)}
              aria-pressed={isSelected}
              aria-label={`Filter by ${label.toLowerCase()} experience${isSelected ? ' (currently selected)' : ''}`}
              className={cn(
                'px-3 py-1.5 font-display text-sm font-semibold',
                'rounded-lg border transition-all duration-200',
                'hover-press shadow-soft focus-natural',
                isSelected
                  ? 'bg-forest text-cream border-forest'
                  : 'bg-cream text-forest border-forest/20 hover:border-forest/40'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Clear all button */}
      {(selectedType || selectedExperience) && (
        <>
          <span className="w-px h-6 bg-forest/20 mx-1" aria-hidden="true" />
          <button
            onClick={() => router.push(pathname, { scroll: false })}
            aria-label="Clear all filters"
            className="px-3 py-1.5 text-sm text-bark/60 hover:text-terracotta transition-colors font-body focus-natural rounded"
          >
            Clear all
          </button>
        </>
      )}
    </div>
  );
}
