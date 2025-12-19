'use client';

import { cn } from '@/lib/utils';
import type { SpringType, ExperienceType } from '@/types/spring';

interface FilterTogglesProps {
  selectedType?: SpringType | null;
  selectedExperience?: ExperienceType | null;
  onTypeChange?: (type: SpringType | null) => void;
  onExperienceChange?: (experience: ExperienceType | null) => void;
  className?: string;
}

export function FilterToggles({
  selectedType,
  selectedExperience,
  onTypeChange,
  onExperienceChange,
  className,
}: FilterTogglesProps) {
  const springTypes: { value: SpringType; label: string; color: string }[] = [
    { value: 'hot', label: 'Hot', color: 'bg-hot text-surface border-hot' },
    { value: 'warm', label: 'Warm', color: 'bg-warm text-ink border-warm' },
    { value: 'cold', label: 'Cold', color: 'bg-cold text-surface border-cold' },
  ];

  const experienceTypes: { value: ExperienceType; label: string }[] = [
    { value: 'resort', label: 'Resort' },
    { value: 'primitive', label: 'Primitive' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Temperature filter */}
      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink/60 mb-3">
          Temperature
        </h3>
        <div className="flex flex-wrap gap-3">
          {springTypes.map(({ value, label, color }) => {
            const isSelected = selectedType === value;
            return (
              <button
                key={value}
                onClick={() => onTypeChange?.(isSelected ? null : value)}
                className={cn(
                  'px-4 py-2 font-display text-sm font-bold uppercase tracking-wide',
                  'border-4 transition-all duration-200',
                  'hover-press',
                  isSelected
                    ? cn(color, 'shadow-brutal-sm')
                    : 'bg-surface text-ink border-ink shadow-brutal-sm hover:shadow-brutal'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Experience filter */}
      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink/60 mb-3">
          Experience
        </h3>
        <div className="flex flex-wrap gap-3">
          {experienceTypes.map(({ value, label }) => {
            const isSelected = selectedExperience === value;
            return (
              <button
                key={value}
                onClick={() => onExperienceChange?.(isSelected ? null : value)}
                className={cn(
                  'px-4 py-2 font-display text-sm font-bold uppercase tracking-wide',
                  'border-4 transition-all duration-200',
                  'hover-press',
                  isSelected
                    ? 'bg-ink text-surface border-ink shadow-brutal-sm'
                    : 'bg-surface text-ink border-ink shadow-brutal-sm hover:shadow-brutal'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Compact version for inline use
export function FilterToggleRow({
  selectedType,
  selectedExperience,
  onTypeChange,
  onExperienceChange,
  className,
}: FilterTogglesProps) {
  const springTypes: { value: SpringType; label: string; color: string }[] = [
    { value: 'hot', label: 'Hot', color: 'bg-hot text-surface border-hot' },
    { value: 'warm', label: 'Warm', color: 'bg-warm text-ink border-warm' },
    { value: 'cold', label: 'Cold', color: 'bg-cold text-surface border-cold' },
  ];

  const experienceTypes: { value: ExperienceType; label: string }[] = [
    { value: 'resort', label: 'Resort' },
    { value: 'primitive', label: 'Primitive' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Temperature toggles */}
      {springTypes.map(({ value, label, color }) => {
        const isSelected = selectedType === value;
        return (
          <button
            key={value}
            onClick={() => onTypeChange?.(isSelected ? null : value)}
            className={cn(
              'px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide',
              'border-2 transition-all duration-200',
              isSelected
                ? cn(color)
                : 'bg-transparent text-ink border-ink/30 hover:border-ink'
            )}
          >
            {label}
          </button>
        );
      })}

      <span className="w-px h-6 bg-ink/20" />

      {/* Experience toggles */}
      {experienceTypes.map(({ value, label }) => {
        const isSelected = selectedExperience === value;
        return (
          <button
            key={value}
            onClick={() => onExperienceChange?.(isSelected ? null : value)}
            className={cn(
              'px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide',
              'border-2 transition-all duration-200',
              isSelected
                ? 'bg-ink text-surface border-ink'
                : 'bg-transparent text-ink border-ink/30 hover:border-ink'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
