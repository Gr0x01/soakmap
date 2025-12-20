import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MapPin, Flame, Droplets, ThermometerSun, Navigation } from 'lucide-react';

import { db } from '@/lib/supabase';
import { getCityBySlug, getAllCitySlugs } from '@/lib/data/cities';
import { filterSprings } from '@/lib/utils/spring-filters';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SpringCard } from '@/components/springs/SpringCard';
import { StatCard } from '@/components/springs/StatCard';
import { StateFilters } from '@/components/springs/StateFilters';
import { SpringMap } from '@/components/maps';
import type { NearbySpring, SpringType, ExperienceType } from '@/types/spring';

// Revalidate every hour
export const revalidate = 3600;

// Generate static params for all seed cities
export async function generateStaticParams() {
  const slugs = getAllCitySlugs();
  return slugs.map((location) => ({ location }));
}

// Generate metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const city = getCityBySlug(location);

  if (!city) {
    return { title: 'Location Not Found' };
  }

  const title = `Natural Springs Near ${city.name}, ${city.state} | SoakMap`;
  const description = `Discover hot springs and swimming holes within 100 miles of ${city.name}, ${city.state}. Find primitive soaks and resort springs near you.`;
  const url = `https://soakmap.com/near/${city.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: 'SoakMap',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// Group springs by distance bands
interface DistanceBand {
  label: string;
  min: number;
  max: number;
  springs: NearbySpring[];
}

function groupByDistance(springs: NearbySpring[]): DistanceBand[] {
  const bands: DistanceBand[] = [
    { label: 'Within 25 miles', min: 0, max: 25, springs: [] },
    { label: '25-50 miles', min: 25, max: 50, springs: [] },
    { label: '50-100 miles', min: 50, max: 100, springs: [] },
  ];

  for (const spring of springs) {
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];
      const isLast = i === bands.length - 1;
      // Last band is inclusive of max (100mi), others are exclusive
      const inRange = isLast
        ? spring.distance_miles >= band.min && spring.distance_miles <= band.max
        : spring.distance_miles >= band.min && spring.distance_miles < band.max;

      if (inRange) {
        band.springs.push(spring);
        break;
      }
    }
  }

  // Only return bands that have springs
  return bands.filter((band) => band.springs.length > 0);
}

export default async function NearPage({
  params,
  searchParams,
}: {
  params: Promise<{ location: string }>;
  searchParams: Promise<{ type?: SpringType; experience?: ExperienceType }>;
}) {
  const { location } = await params;
  const { type: springType, experience: experienceType } = await searchParams;

  const city = getCityBySlug(location);

  if (!city) {
    notFound();
  }

  // Fetch nearby springs (100 mile radius, up to 50 results)
  const result = await db.getNearby(city.lat, city.lng, 100, 50);
  const allSprings = result.ok ? result.data : [];

  // Apply filters
  const springs = filterSprings(allSprings, springType, experienceType);

  // Group by distance
  const distanceBands = groupByDistance(springs);

  // Counts for display
  const hotCount = allSprings.filter((s) => s.spring_type === 'hot').length;
  const warmCount = allSprings.filter((s) => s.spring_type === 'warm').length;
  const coldCount = allSprings.filter((s) => s.spring_type === 'cold').length;
  const totalCount = allSprings.length;

  // Convert NearbySpring to SpringSummary for map (they have compatible fields now)
  const springsForMap = springs.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    state: s.state,
    lat: s.lat,
    lng: s.lng,
    spring_type: s.spring_type,
    experience_type: s.experience_type,
    photo_url: s.photo_url,
  }));

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
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-terracotta/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-river/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 text-bark/60 font-body text-sm mb-3">
                <Navigation className="w-4 h-4" />
                <span>Within 100 miles</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest mb-4 leading-tight">
                Natural Springs Near {city.name}
              </h1>

              <p className="text-lg text-bark/70 font-body max-w-2xl">
                {totalCount > 0 ? (
                  <>
                    Discover {totalCount} hot springs, warm springs, and swimming holes within 100 miles of{' '}
                    {city.name}, {city.state}. Filter by temperature or experience type to find your perfect soak.
                  </>
                ) : (
                  <>
                    We&apos;re still mapping springs near {city.name}, {city.state}. Check back soon or explore
                    nearby states.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {totalCount > 0 && (
          <div className="container-brutal mb-8">
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon={Flame} label="Hot Springs" count={hotCount} color="terracotta" />
              <StatCard icon={ThermometerSun} label="Warm Springs" count={warmCount} color="moss" />
              <StatCard icon={Droplets} label="Swimming Holes" count={coldCount} color="river" />
            </div>
          </div>
        )}

        {/* Filters */}
        {totalCount > 0 && (
          <div className="container-brutal mb-8">
            <div className="bg-cream rounded-xl p-4 border border-forest/10 shadow-soft">
              <StateFilters />
            </div>
          </div>
        )}

        {/* Results count */}
        {totalCount > 0 && (
          <div className="container-brutal mb-6">
            <p className="text-bark/60 font-body">
              Showing <span className="font-semibold text-forest">{springs.length}</span>{' '}
              {springs.length === 1 ? 'spring' : 'springs'}
              {(springType || experienceType) && (
                <>
                  {' '}
                  <span className="text-bark/40">(filtered from {totalCount} total)</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Interactive map */}
        {springs.length > 0 && (
          <div className="container-brutal mb-12">
            <div className="aspect-[16/9] rounded-xl overflow-hidden shadow-soft border border-forest/10">
              <SpringMap springs={springsForMap} center={[city.lng, city.lat]} zoom={8} />
            </div>
          </div>
        )}

        {/* Springs grouped by distance */}
        <div className="container-brutal">
          {distanceBands.length > 0 ? (
            <div className="space-y-12">
              {distanceBands.map((band) => (
                <section key={band.label}>
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-5 h-5 text-forest/60" />
                    <h2 className="font-display text-2xl font-bold text-forest">
                      {band.label}
                    </h2>
                    <span className="text-bark/50 font-body">
                      ({band.springs.length} {band.springs.length === 1 ? 'spring' : 'springs'})
                    </span>
                  </div>

                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {band.springs.map((spring) => (
                      <SpringCard
                        key={spring.id}
                        spring={{
                          id: spring.id,
                          name: spring.name,
                          slug: spring.slug,
                          state: spring.state,
                          lat: spring.lat,
                          lng: spring.lng,
                          spring_type: spring.spring_type,
                          experience_type: spring.experience_type,
                          photo_url: spring.photo_url,
                          temp_f: spring.temp_f ?? null,
                          access_difficulty: spring.access_difficulty ?? null,
                          parking: spring.parking ?? null,
                          fee_type: spring.fee_type ?? null,
                        }}
                        distance={spring.distance_miles}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="bg-cream rounded-xl p-12 text-center border border-forest/10">
              <Droplets className="w-12 h-12 mx-auto text-bark/30 mb-4" />
              <h3 className="font-display text-xl font-semibold text-forest mb-2">
                {totalCount === 0 ? 'No springs found nearby' : 'No springs match your filters'}
              </h3>
              <p className="text-bark/60 font-body mb-4">
                {totalCount === 0
                  ? `We haven't mapped any springs within 100 miles of ${city.name} yet.`
                  : 'Try adjusting your filters to see more results.'}
              </p>
              {totalCount > 0 ? (
                <Link
                  href={`/near/${city.slug}`}
                  className="inline-flex items-center gap-2 text-forest hover:text-terracotta transition-colors font-display font-medium"
                >
                  Clear all filters
                </Link>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-forest hover:text-terracotta transition-colors font-display font-medium"
                >
                  Browse all states
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
