import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, Droplets, Flame, ThermometerSun } from 'lucide-react';

import { db } from '@/lib/supabase';
import { filterSprings } from '@/lib/utils/spring-filters';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SpringGrid } from '@/components/springs/SpringCard';
import { StatCard } from '@/components/springs/StatCard';
import { StateFilters } from '@/components/springs/StateFilters';
import type { SpringType, ExperienceType } from '@/types/spring';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'All Natural Springs | SoakMap',
  description:
    'Browse all natural springs across America. Find hot springs for winter soaking, swimming holes for summer escapes, and everything in between.',
  alternates: {
    canonical: 'https://soakmap.com/springs',
  },
  openGraph: {
    title: 'All Natural Springs | SoakMap',
    description:
      'Browse all natural springs across America. Find hot springs for winter soaking, swimming holes for summer escapes, and everything in between.',
    type: 'website',
    url: 'https://soakmap.com/springs',
    siteName: 'SoakMap',
  },
};

export default async function SpringsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: SpringType; experience?: ExperienceType }>;
}) {
  const { type: springType, experience: experienceType } = await searchParams;

  // Fetch all springs and stats
  const [springsResult, statsResult] = await Promise.all([
    db.getSprings({ limit: 500 }),
    db.getStats(),
  ]);

  const allSprings = springsResult.ok ? springsResult.data : [];
  const stats = statsResult.ok ? statsResult.data : { total: 0, hot: 0, warm: 0, cold: 0 };

  // Apply filters
  const springs = filterSprings(allSprings, springType, experienceType);

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
            {/* Decorative blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-terracotta/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-river/10 blur-3xl" />

            <div className="relative">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest mb-4 leading-tight">
                All Natural Springs
              </h1>

              <p className="text-lg text-bark/70 font-body max-w-2xl">
                Discover {stats.total.toLocaleString()} hot springs, warm springs, and swimming
                holes across America. Filter by temperature or experience type to find your perfect
                soak.
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="container-brutal mb-8">
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={Flame} label="Hot Springs" count={stats.hot} color="terracotta" />
            <StatCard icon={ThermometerSun} label="Warm Springs" count={stats.warm} color="moss" />
            <StatCard icon={Droplets} label="Swimming Holes" count={stats.cold} color="river" />
          </div>
        </div>

        {/* Filters */}
        <div className="container-brutal mb-8">
          <div className="bg-cream rounded-xl p-4 border border-forest/10 shadow-soft">
            <StateFilters />
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
                <span className="text-bark/40">(filtered from {stats.total} total)</span>
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
                href="/springs"
                className="inline-flex items-center gap-2 text-forest hover:text-terracotta transition-colors font-display font-medium"
              >
                Clear all filters
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
