import Link from 'next/link';
import { MapPin, Footprints, DollarSign, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpringSummary, AccessDifficulty, ParkingType, FeeType } from '@/types/spring';

// =============================================================================
// Formatting Helpers
// =============================================================================

const accessLabels: Record<AccessDifficulty, string> = {
  drive_up: 'Drive up',
  short_walk: 'Short walk',
  moderate_hike: 'Hike',
  difficult_hike: 'Long hike',
};

const feeLabels: Record<FeeType, string> = {
  free: 'Free',
  paid: 'Paid',
  donation: 'Donation',
  unknown: '',
};

function formatTemp(tempF: number | null, type: string): string {
  if (tempF) return `${Math.round(tempF)}°`;
  return type === 'hot' ? 'Hot' : type === 'warm' ? 'Warm' : 'Cold';
}

// =============================================================================
// SpringCard Component - Compact, Info-Dense Editorial Design
// =============================================================================

interface SpringCardProps {
  spring: SpringSummary;
  className?: string;
  distance?: number;
}

export function SpringCard({ spring, className, distance }: SpringCardProps) {
  const hasAccess = spring.access_difficulty && spring.access_difficulty !== 'drive_up';
  const hasFee = spring.fee_type && spring.fee_type !== 'unknown';
  const hasParking = spring.parking && spring.parking !== 'ample';

  return (
    <Link
      href={`/springs/${spring.slug}`}
      className={cn(
        'group block',
        'bg-cream border border-forest/8 rounded-lg',
        'hover:border-forest/20 hover:shadow-md',
        'transition-all duration-200',
        className
      )}
    >
      {/* Main content row */}
      <div className="flex gap-4 p-4">
        {/* Temperature display - context, not competing */}
        <div
          className={cn(
            'flex-shrink-0 w-14 h-14 rounded-md flex flex-col items-center justify-center',
            'font-display tracking-tight',
            {
              'bg-terracotta/10 text-terracotta': spring.spring_type === 'hot',
              'bg-moss/10 text-moss': spring.spring_type === 'warm',
              'bg-river/10 text-river': spring.spring_type === 'cold',
            }
          )}
        >
          <span className="text-xl font-semibold leading-none">
            {spring.temp_f ? Math.round(spring.temp_f) : '—'}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wider opacity-60 mt-0.5">
            {spring.temp_f ? '°F' : spring.spring_type}
          </span>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          {/* Name - THE focal point */}
          <h3 className="font-display text-base font-bold text-forest leading-snug line-clamp-2 group-hover:text-terracotta transition-colors">
            {spring.name}
          </h3>

          {/* Location + Experience type - secondary info, same line */}
          <div className="flex items-center gap-1.5 text-bark/50 text-sm font-body mt-1 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{spring.state}</span>
            {distance !== undefined && (
              <>
                <span>·</span>
                <span>{Math.round(distance)} mi</span>
              </>
            )}
            <span>·</span>
            <span className="capitalize">{spring.experience_type}</span>
          </div>

          {/* Practical info chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {hasAccess && (
              <span className="inline-flex items-center gap-1 text-[11px] text-bark/50 bg-stone/80 px-1.5 py-0.5 rounded font-body">
                <Footprints className="w-3 h-3" />
                {accessLabels[spring.access_difficulty!]}
              </span>
            )}
            {hasFee && (
              <span className={cn(
                'inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-body',
                spring.fee_type === 'free' ? 'text-moss/70 bg-moss/10' : 'text-bark/50 bg-stone/80'
              )}>
                <DollarSign className="w-3 h-3" />
                {feeLabels[spring.fee_type!]}
              </span>
            )}
            {hasParking && (
              <span className="inline-flex items-center gap-1 text-[11px] text-bark/50 bg-stone/80 px-1.5 py-0.5 rounded font-body">
                <Car className="w-3 h-3" />
                {spring.parking === 'very_limited' ? 'Limited' : spring.parking}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// SpringGrid Component
// =============================================================================

interface SpringGridProps {
  springs: SpringSummary[];
  className?: string;
}

export function SpringGrid({ springs, className }: SpringGridProps) {
  return (
    <div
      className={cn(
        'grid gap-3',
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
