import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MapPin, Flame, Droplets, ThermometerSun, Navigation } from 'lucide-react';

import { db } from '@/lib/supabase';
import { filterSprings } from '@/lib/utils/spring-filters';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SpringCard } from '@/components/springs/SpringCard';
import { StatCard } from '@/components/springs/StatCard';
import { StateFilters } from '@/components/springs/StateFilters';
import { SpringMap } from '@/components/maps';
import { SEED_CITIES } from '@/lib/data/seed-cities';
import type { NearbySpring, SpringType, ExperienceType } from '@/types/spring';

// No caching for dynamic geolocation requests
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Springs Near You | SoakMap',
  description: 'Find natural hot springs and swimming holes near your current location.',
};

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
      const inRange = isLast
        ? spring.distance_miles >= band.min && spring.distance_miles <= band.max
        : spring.distance_miles >= band.min && spring.distance_miles < band.max;

      if (inRange) {
        band.springs.push(spring);
        break;
      }
    }
  }

  return bands.filter((band) => band.springs.length > 0);
}

export default async function NearMePage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string; type?: SpringType; experience?: ExperienceType }>;
}) {
  const { lat: latStr, lng: lngStr, type: springType, experience: experienceType } = await searchParams;

  // If no coordinates provided, show the seed cities as options
  if (!latStr || !lngStr) {
    return (
      <div className="min-h-screen bg-stone">
        <Header />

        <main className="pt-8 pb-20">
          <div className="container-brutal mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-bark/60 hover:text-forest transition-colors font-body text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Home
            </Link>
          </div>

          <div className="container-brutal mb-12">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest/5 via-transparent to-sand/20 p-8 md:p-12 border border-forest/10">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-terracotta/10 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-river/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-2 text-bark/60 font-body text-sm mb-3">
                  <Navigation className="w-4 h-4" />
                  <span>Find nearby springs</span>
                </div>

                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest mb-4 leading-tight">
                  Springs Near You
                </h1>

                <p className="text-lg text-bark/70 font-body max-w-2xl">
                  Select a city below to find hot springs and swimming holes nearby, or use the &quot;Find springs near me&quot; button on the homepage to search from your current location.
                </p>
              </div>
            </div>
          </div>

          {/* Seed cities grid */}
          <div className="container-brutal">
            <h2 className="font-display text-2xl font-bold text-forest mb-6">
              Popular Locations
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SEED_CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/near/${city.slug}`}
                  className="group flex items-center gap-4 p-4 bg-cream rounded-xl border border-forest/10 shadow-soft hover:shadow-medium hover:border-forest/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-forest/5 flex items-center justify-center group-hover:bg-forest/10 transition-colors">
                    <MapPin className="w-5 h-5 text-forest" />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-forest group-hover:text-terracotta transition-colors">
                      {city.name}, {city.state}
                    </div>
                    <div className="text-sm text-bark/60 font-body">
                      Find springs within 100 miles
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Parse and validate coordinates
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    redirect('/near');
  }

  // Fetch nearby springs (100 mile radius, up to 50 results)
  const result = await db.getNearby(lat, lng, 100, 50);
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

  // Convert for map
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
            Home
          </Link>
        </div>

        {/* Hero section */}
        <div className="container-brutal mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest/5 via-transparent to-sand/20 p-8 md:p-12 border border-forest/10">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-terracotta/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-river/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 text-bark/60 font-body text-sm mb-3">
                <Navigation className="w-4 h-4" />
                <span>Within 100 miles of your location</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest mb-4 leading-tight">
                Springs Near You
              </h1>

              <p className="text-lg text-bark/70 font-body max-w-2xl">
                {totalCount > 0 ? (
                  <>
                    Found {totalCount} hot springs, warm springs, and swimming holes within 100
                    miles of your location. Filter by temperature or experience type to find your
                    perfect soak.
                  </>
                ) : (
                  <>
                    We haven&apos;t mapped any springs within 100 miles of your location yet. Try
                    browsing by state or check out one of our featured cities.
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
              <SpringMap springs={springsForMap} center={[lng, lat]} zoom={8} />
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
                    <h2 className="font-display text-2xl font-bold text-forest">{band.label}</h2>
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
                  ? "We haven't mapped any springs within 100 miles of your location yet."
                  : 'Try adjusting your filters to see more results.'}
              </p>
              <Link
                href="/states"
                className="inline-flex items-center gap-2 text-forest hover:text-terracotta transition-colors font-display font-medium"
              >
                Browse by state instead
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
