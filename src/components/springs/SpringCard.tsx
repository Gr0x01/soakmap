import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpringTypeBadge, ExperienceTypeBadge } from '@/components/ui/Badge';
import type { SpringSummary } from '@/types/spring';

interface SpringCardProps {
  spring: SpringSummary;
  className?: string;
  /** Optional distance in miles (shown as badge when provided) */
  distance?: number;
}

export function SpringCard({ spring, className, distance }: SpringCardProps) {
  return (
    <Link
      href={`/springs/${spring.slug}`}
      className={cn(
        'group block bg-cream rounded-xl shadow-soft',
        'hover-lift transition-all duration-300',
        'overflow-hidden border border-forest/5',
        className
      )}
    >
      {/* Photo area or gradient placeholder */}
      <div
        className={cn(
          'aspect-[4/3] relative overflow-hidden',
          'bg-gradient-to-br',
          {
            'from-terracotta/10 via-terracotta/5 to-sand/20': spring.spring_type === 'hot',
            'from-moss/10 via-moss/5 to-sand/20': spring.spring_type === 'warm',
            'from-river/10 via-river/5 to-sand/20': spring.spring_type === 'cold',
          }
        )}
      >
        {spring.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={spring.photo_url}
            alt={spring.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // Decorative organic shape placeholder
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                'w-32 h-32 rounded-full blur-3xl opacity-40',
                {
                  'bg-terracotta': spring.spring_type === 'hot',
                  'bg-moss': spring.spring_type === 'warm',
                  'bg-river': spring.spring_type === 'cold',
                }
              )}
            />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          <SpringTypeBadge type={spring.spring_type} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-forest leading-tight mb-2 group-hover:text-terracotta transition-colors">
          {spring.name}
        </h3>

        <div className="flex items-center gap-1.5 text-bark/60 text-sm mb-3 font-body">
          <MapPin className="w-3.5 h-3.5" />
          <span>{spring.state}</span>
          {distance !== undefined && (
            <>
              <span className="text-bark/30" aria-hidden="true">·</span>
              <span aria-label={`${Math.round(distance)} miles away`}>
                {Math.round(distance)} mi
              </span>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <ExperienceTypeBadge type={spring.experience_type} />
        </div>
      </div>
    </Link>
  );
}

// Grid wrapper for multiple cards
interface SpringGridProps {
  springs: SpringSummary[];
  className?: string;
}

export function SpringGrid({ springs, className }: SpringGridProps) {
  return (
    <div
      className={cn(
        'grid gap-6',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {springs.map((spring) => (
        <SpringCard key={spring.id} spring={spring} />
      ))}
    </div>
  );
}
