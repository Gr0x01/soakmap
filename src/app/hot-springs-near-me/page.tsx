import { Suspense } from 'react';
import { Metadata } from 'next';
import { Loader2, Clock } from 'lucide-react';

import { db } from '@/lib/supabase';
import { safeJsonLd, generateBreadcrumbSchema, generateItemListSchema } from '@/lib/schema';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  NearMeHero,
  NearMeResults,
  CityDirectory,
  NearMeFAQ,
  generateFAQSchema,
  FeaturedSpringsGrid,
  StateQuickLinks,
  EditorialContent,
} from '@/components/near-me';
import { NEAR_ME_CONTENT, getCitiesForSpringType } from '@/lib/data/near-me-content';
import { SEED_CITIES } from '@/lib/data/seed-cities';

// ISR: Revalidate every hour
export const revalidate = 3600;

const PAGE_TYPE = 'hot-springs';
const content = NEAR_ME_CONTENT[PAGE_TYPE];

export const metadata: Metadata = {
  title: content.title,
  description: content.metaDescription,
  alternates: {
    canonical: 'https://soakmap.com/hot-springs-near-me',
  },
  openGraph: {
    title: content.title,
    description: content.metaDescription,
    type: 'website',
    url: 'https://soakmap.com/hot-springs-near-me',
    siteName: 'SoakMap',
  },
  twitter: {
    card: 'summary_large_image',
    title: content.title,
    description: content.metaDescription,
  },
};

function ResultsSkeleton() {
  return (
    <section className="container-brutal py-12">
      <div className="flex flex-col items-center justify-center text-center">
        <Loader2 className="w-10 h-10 text-forest animate-spin mb-4" />
        <p className="text-bark/70 font-body">Loading...</p>
      </div>
    </section>
  );
}

// Fallback stats if database is unavailable
const FALLBACK_STATS = { total: 2900, hot: 1500, warm: 400, cold: 1000 };

export default async function HotSpringsNearMePage() {
  // Get stats for hero
  const statsResult = await db.getStats();
  if (!statsResult.ok) {
    console.error('[Hot Springs Near Me] Failed to load stats:', statsResult.error);
  }
  const stats = statsResult.ok ? statsResult.data : FALLBACK_STATS;

  // Get featured hot springs (16 for grid, first 6 for fallback)
  const springsResult = await db.getSprings({ spring_type: 'hot', limit: 16 });
  if (!springsResult.ok) {
    console.error('[Hot Springs Near Me] Failed to load springs:', springsResult.error);
  }
  const featuredSprings = springsResult.ok ? springsResult.data : [];

  // Get all states for quick links
  const statesResult = await db.getStates();
  if (!statesResult.ok) {
    console.error('[Hot Springs Near Me] Failed to load states:', statesResult.error);
  }
  const states = statesResult.ok ? statesResult.data : [];

  // Get relevant cities
  const cities = getCitiesForSpringType(PAGE_TYPE, SEED_CITIES);

  // Structured data schemas
  const faqSchema = generateFAQSchema(content.faqs);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://soakmap.com' },
    { name: 'Hot Springs Near Me', url: 'https://soakmap.com/hot-springs-near-me' },
  ]);
  const itemListSchema = generateItemListSchema(
    featuredSprings.map((s) => ({ name: s.name, slug: s.slug })),
    'Popular Hot Springs'
  );

  return (
    <div className="min-h-screen bg-stone">
      <Header />

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-forest focus:text-cream focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Structured Data - XSS-safe */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListSchema) }}
        />
      )}

      <main id="main-content" className="pt-8 pb-20">
        {/* Hero */}
        <NearMeHero
          pageType={PAGE_TYPE}
          title={content.h1}
          intro={content.intro}
          springCount={stats.hot}
        />

        {/* Geolocation + Results */}
        <Suspense fallback={<ResultsSkeleton />}>
          <NearMeResults springType="hot" fallbackSprings={featuredSprings.slice(0, 6)} />
        </Suspense>

        {/* Featured Springs Grid - Static SSR content for SEO */}
        <FeaturedSpringsGrid
          springs={featuredSprings}
          title="Popular Hot Springs"
          description="Explore some of the most visited natural hot springs across the United States."
          viewAllHref="/states"
          viewAllLabel="Browse all states"
        />

        {/* State Quick Links */}
        <StateQuickLinks
          states={states}
          title="Hot Springs by State"
          description="Find hot springs in your state or plan a trip to a new destination."
          springType="hot"
        />

        {/* City Directory */}
        <CityDirectory
          cities={cities}
          title="Find Hot Springs by City"
          description="Browse hot springs near major cities across America."
        />

        {/* Editorial Content for SEO */}
        <EditorialContent content={content.editorial} />

        {/* Content freshness signal */}
        <div className="container-brutal pb-8">
          <div className="flex items-center gap-2 text-bark/40 text-sm font-body">
            <Clock className="w-4 h-4" />
            <span>Content last updated December 2025</span>
          </div>
        </div>

        {/* FAQ Section */}
        <NearMeFAQ faqs={content.faqs} />
      </main>

      <Footer />
    </div>
  );
}
