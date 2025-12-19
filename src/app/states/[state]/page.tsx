import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MapPin, Flame, Droplets, ThermometerSun } from 'lucide-react';

import { db } from '@/lib/supabase';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SpringGrid } from '@/components/springs/SpringCard';
import { FilterToggles } from '@/components/home/FilterToggles';
import type { SpringSummary, SpringType, ExperienceType } from '@/types/spring';

// State name lookup
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// Revalidate every hour
export const revalidate = 3600;

// Generate static params for all states with springs
export async function generateStaticParams() {
  const result = await db.getStates();
  if (!result.ok) return [];

  return result.data.map((state) => ({
    state: state.code.toLowerCase(),
  }));
}

// Generate metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const stateCode = state.toUpperCase();
  const stateName = STATE_NAMES[stateCode];

  if (!stateName) {
    return { title: 'State Not Found' };
  }

  const result = await db.getStateByCode(stateCode);
  const stateData = result.ok ? result.data : null;

  const springCount = stateData?.spring_count || 0;
  const title = `Hot Springs & Swimming Holes in ${stateName}`;
  const description = `Discover ${springCount} natural springs in ${stateName}. Find hot springs, warm springs, and swimming holes with detailed access info.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

// Filter springs based on URL search params
function filterSprings(
  springs: SpringSummary[],
  springType?: SpringType,
  experienceType?: ExperienceType
): SpringSummary[] {
  let filtered = springs;

  if (springType) {
    filtered = filtered.filter((s) => s.spring_type === springType);
  }

  if (experienceType) {
    filtered = filtered.filter((s) => s.experience_type === experienceType);
  }

  return filtered;
}

// Stat card component
function StatCard({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: 'terracotta' | 'moss' | 'river';
}) {
  const colorClasses = {
    terracotta: 'bg-terracotta/10 text-terracotta',
    moss: 'bg-moss/10 text-moss',
    river: 'bg-river/10 text-river',
  };

  return (
    <div className="bg-cream rounded-xl p-4 border border-forest/10 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-forest">{count}</p>
          <p className="text-sm text-bark/60 font-body">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default async function StatePage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string }>;
  searchParams: Promise<{ type?: SpringType; experience?: ExperienceType }>;
}) {
  const { state } = await params;
  const { type: springType, experience: experienceType } = await searchParams;

  const stateCode = state.toUpperCase();
  const stateName = STATE_NAMES[stateCode];

  if (!stateName) {
    notFound();
  }

  // Fetch state data and springs in parallel
  const [stateResult, springsResult] = await Promise.all([
    db.getStateByCode(stateCode),
    db.getSpringsByState(stateCode),
  ]);

  const stateData = stateResult.ok ? stateResult.data : null;
  const allSprings = springsResult.ok ? springsResult.data : [];

  // Apply filters
  const springs = filterSprings(allSprings, springType, experienceType);

  // Counts for display
  const hotCount = stateData?.hot_count || allSprings.filter((s) => s.spring_type === 'hot').length;
  const warmCount = stateData?.warm_count || allSprings.filter((s) => s.spring_type === 'warm').length;
  const coldCount = stateData?.cold_count || allSprings.filter((s) => s.spring_type === 'cold').length;
  const totalCount = stateData?.spring_count || allSprings.length;

  return (
    <div className="min-h-screen bg-stone">
      <Header />

      <main className="pt-8 pb-20">
        {/* Breadcrumb */}
        <div className="container-brutal mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-bark/60 hover:text-forest transition-colors font-body text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            All States
          </Link>
        </div>

        {/* Hero section */}
        <div className="container-brutal mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest/5 via-transparent to-sand/20 p-8 md:p-12 border border-forest/10">
            {/* Decorative blob */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-moss/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-river/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 text-bark/60 font-body text-sm mb-3">
                <MapPin className="w-4 h-4" />
                <span>United States</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest mb-4 leading-tight">
                Natural Springs in {stateName}
              </h1>

              <p className="text-lg text-bark/70 font-body max-w-2xl">
                Explore {totalCount} hot springs, warm springs, and swimming holes across {stateName}.
                Filter by temperature or experience type to find your perfect soak.
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="container-brutal mb-8">
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={Flame} label="Hot Springs" count={hotCount} color="terracotta" />
            <StatCard icon={ThermometerSun} label="Warm Springs" count={warmCount} color="moss" />
            <StatCard icon={Droplets} label="Swimming Holes" count={coldCount} color="river" />
          </div>
        </div>

        {/* Filters */}
        <div className="container-brutal mb-8">
          <div className="bg-cream rounded-xl p-4 border border-forest/10 shadow-soft">
            <FilterToggles variant="compact" />
          </div>
        </div>

        {/* Results count */}
        <div className="container-brutal mb-6">
          <p className="text-bark/60 font-body">
            Showing <span className="font-semibold text-forest">{springs.length}</span>{' '}
            {springs.length === 1 ? 'spring' : 'springs'}
            {(springType || experienceType) && (
              <>
                {' '}
                <span className="text-bark/40">
                  (filtered from {totalCount} total)
                </span>
              </>
            )}
          </p>
        </div>

        {/* Springs grid */}
        <div className="container-brutal">
          {springs.length > 0 ? (
            <SpringGrid springs={springs} />
          ) : (
            <div className="bg-cream rounded-xl p-12 text-center border border-forest/10">
              <Droplets className="w-12 h-12 mx-auto text-bark/30 mb-4" />
              <h3 className="font-display text-xl font-semibold text-forest mb-2">
                No springs found
              </h3>
              <p className="text-bark/60 font-body mb-4">
                Try adjusting your filters to see more results.
              </p>
              <Link
                href={`/states/${state}`}
                className="inline-flex items-center gap-2 text-forest hover:text-terracotta transition-colors font-display font-medium"
              >
                Clear all filters
              </Link>
            </div>
          )}
        </div>

        {/* Map placeholder - will be replaced with MapLibre */}
        {springs.length > 0 && (
          <div className="container-brutal mt-12">
            <h2 className="font-display text-2xl font-bold text-forest mb-6">
              Map View
            </h2>
            <div className="aspect-[16/9] rounded-xl bg-cream border border-forest/10 overflow-hidden relative shadow-soft">
              <div className="absolute inset-0 bg-topo opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto text-forest/30 mb-3" />
                  <p className="text-bark/50 font-body">
                    Interactive map coming soon
                  </p>
                  <p className="text-sm text-bark/40 font-body mt-1">
                    {springs.length} springs in {stateName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
