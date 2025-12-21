import Link from 'next/link';
import type { State } from '@/types';

interface StateQuickLinksProps {
  states: State[];
  title: string;
  description: string;
  springType?: 'hot' | 'warm' | 'cold';
}

export function StateQuickLinks({ states, title, description, springType }: StateQuickLinksProps) {
  // Filter states that have springs of the specified type
  const relevantStates = springType
    ? states.filter((s) => {
        if (springType === 'hot') return (s.hot_count || 0) > 0;
        if (springType === 'warm') return (s.warm_count || 0) > 0;
        if (springType === 'cold') return (s.cold_count || 0) > 0;
        return s.spring_count > 0;
      })
    : states.filter((s) => s.spring_count > 0);

  // Sort by spring count (descending) to show most relevant states first
  const sortedStates = [...relevantStates].sort((a, b) => {
    if (springType === 'hot') return (b.hot_count || 0) - (a.hot_count || 0);
    if (springType === 'cold') return (b.cold_count || 0) - (a.cold_count || 0);
    return b.spring_count - a.spring_count;
  });

  if (sortedStates.length === 0) return null;

  return (
    <section className="container-brutal py-12 border-t border-forest/10">
      <div className="mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-forest mb-2">
          {title}
        </h2>
        <p className="text-bark/60 font-body">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedStates.map((state) => {
          const count = springType === 'hot'
            ? state.hot_count
            : springType === 'cold'
              ? state.cold_count
              : state.spring_count;

          return (
            <Link
              key={state.code}
              href={`/${state.code.toLowerCase()}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream border border-forest/10 rounded-full text-sm font-body text-bark/80 hover:border-forest/30 hover:text-forest transition-colors"
            >
              <span className="font-medium">{state.name}</span>
              <span className="text-bark/50">({count})</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
