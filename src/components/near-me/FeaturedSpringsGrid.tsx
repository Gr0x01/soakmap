import Link from 'next/link';
import { SpringCard } from '@/components/springs/SpringCard';
import type { SpringSummary } from '@/types/spring';

interface FeaturedSpringsGridProps {
  springs: SpringSummary[];
  title: string;
  description: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function FeaturedSpringsGrid({
  springs,
  title,
  description,
  viewAllHref,
  viewAllLabel = 'View all',
}: FeaturedSpringsGridProps) {
  if (springs.length === 0) return null;

  return (
    <section className="container-brutal py-12 border-t border-forest/10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-forest mb-2">
            {title}
          </h2>
          <p className="text-bark/60 font-body max-w-2xl">{description}</p>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-forest hover:text-terracotta font-display font-medium transition-colors whitespace-nowrap"
          >
            {viewAllLabel} →
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {springs.map((spring) => (
          <SpringCard key={spring.id} spring={spring} />
        ))}
      </div>
    </section>
  );
}
