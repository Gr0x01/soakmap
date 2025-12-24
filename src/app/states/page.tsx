import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

import { db } from '@/lib/supabase';
import { getStateName } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const revalidate = 86400; // 24 hours - data rarely changes

export const metadata: Metadata = {
  title: 'Browse Springs by State | SoakMap',
  description:
    'Find natural hot springs and swimming holes in your state. Browse all 50 US states to discover nearby soaking destinations.',
  alternates: {
    canonical: 'https://soakmap.com/states',
  },
  openGraph: {
    title: 'Browse Springs by State | SoakMap',
    description:
      'Find natural hot springs and swimming holes in your state. Browse all 50 US states to discover nearby soaking destinations.',
    type: 'website',
    url: 'https://soakmap.com/states',
    siteName: 'SoakMap',
  },
};

export default async function StatesPage() {
  const result = await db.getStates();
  const states = result.ok ? result.data : [];

  // Sort states by spring count (most springs first)
  const sortedStates = [...states].sort((a, b) => b.spring_count - a.spring_count);

  // Separate states with springs from those without
  const statesWithSprings = sortedStates.filter((s) => s.spring_count > 0);
  const statesWithoutSprings = sortedStates.filter((s) => s.spring_count === 0);

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
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-moss/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-terracotta/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 text-bark/60 font-body text-sm mb-3">
                <MapPin className="w-4 h-4" />
                <span>United States</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest mb-4 leading-tight">
                Browse by State
              </h1>

              <p className="text-lg text-bark/70 font-body max-w-2xl">
                Explore natural springs across {statesWithSprings.length} US states. Select a state
                to discover hot springs, swimming holes, and hidden soaking spots.
              </p>
            </div>
          </div>
        </div>

        {/* States with springs */}
        <div className="container-brutal mb-12">
          <h2 className="font-display text-2xl font-bold text-forest mb-6">
            States with Springs ({statesWithSprings.length})
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statesWithSprings.map((state) => (
              <Link
                key={state.code}
                href={`/${state.code.toLowerCase()}`}
                className="group flex items-center justify-between p-4 bg-cream rounded-xl border border-forest/10 shadow-soft hover:shadow-medium hover:border-forest/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-forest/5 flex items-center justify-center group-hover:bg-forest/10 transition-colors">
                    <span className="font-display font-bold text-forest text-sm">{state.code}</span>
                  </div>
                  <div>
                    <div className="font-display font-semibold text-forest group-hover:text-terracotta transition-colors">
                      {getStateName(state.code)}
                    </div>
                    <div className="text-sm text-bark/60 font-body">
                      {state.spring_count} {state.spring_count === 1 ? 'spring' : 'springs'}
                      {state.hot_count > 0 && (
                        <span className="text-terracotta ml-1">
                          · {state.hot_count} hot
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-bark/30 group-hover:text-forest transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* States without springs (collapsed by default) */}
        {statesWithoutSprings.length > 0 && (
          <div className="container-brutal">
            <details className="group">
              <summary className="cursor-pointer font-display text-lg font-semibold text-bark/50 mb-4 list-none flex items-center gap-2">
                <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                States without data ({statesWithoutSprings.length})
              </summary>

              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 mt-4">
                {statesWithoutSprings.map((state) => (
                  <div
                    key={state.code}
                    className="flex items-center gap-2 p-3 bg-cream/50 rounded-lg border border-forest/5 text-bark/40"
                  >
                    <span className="font-display font-medium text-sm">{state.code}</span>
                    <span className="font-body text-sm">
                      {getStateName(state.code)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
