import Link from 'next/link';
import type { SeedCity } from '@/lib/data/seed-cities';

interface CityDirectoryProps {
  cities: SeedCity[];
  title?: string;
  description?: string;
}

export function CityDirectory({
  cities,
  title = 'Find Springs by City',
  description = 'Select a city to see hot springs and swimming holes nearby.',
}: CityDirectoryProps) {
  // Group cities by state
  const citiesByState = cities.reduce(
    (acc, city) => {
      if (!acc[city.state]) {
        acc[city.state] = [];
      }
      acc[city.state].push(city);
      return acc;
    },
    {} as Record<string, SeedCity[]>
  );

  // Sort states alphabetically
  const sortedStates = Object.keys(citiesByState).sort();

  return (
    <section className="container-brutal py-12" aria-labelledby="city-directory-heading">
      <div className="mb-8">
        <h2 id="city-directory-heading" className="font-display text-2xl md:text-3xl font-bold text-forest mb-2">
          {title}
        </h2>
        <p className="text-bark/60 font-body">{description}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {sortedStates.map((state) => (
          <div key={state} role="region" aria-label={`Cities in ${state}`}>
            {/* Use p instead of h3 for state labels - they're category labels, not semantic headings */}
            <p className="font-display font-semibold text-forest/80 text-sm uppercase tracking-wide mb-3 border-b border-forest/10 pb-2">
              {state}
            </p>
            <ul className="space-y-2" aria-label={`Cities in ${state}`}>
              {citiesByState[state].map((city) => (
                <li key={city.slug}>
                  <Link
                    href={`/near/${city.slug}`}
                    className="text-bark/70 hover:text-forest transition-colors font-body focus:outline-none focus:text-forest focus:underline"
                    aria-label={`Find springs near ${city.name}, ${state}`}
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
