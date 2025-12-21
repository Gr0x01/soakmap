import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
import {
  TYPE_CONTENT,
  getSpringTypeFromSlug,
  getCitiesForType,
  type TypePageSlug,
} from '@/lib/data/type-content';
import { SEED_CITIES } from '@/lib/data/seed-cities';

// ISR: Revalidate every hour
export const revalidate = 3600;

interface TypePageProps {
  params: {
    type: string;
  };
}

// Fallback stats if database is unavailable
const FALLBACK_STATS = { total: 2900, hot: 1500, warm: 400, cold: 1000 };

// Valid type slugs
const VALID_TYPES: TypePageSlug[] = ['hot-springs', 'swimming-holes', 'warm-springs'];

function isValidTypeSlug(type: string): type is TypePageSlug {
  return VALID_TYPES.includes(type as TypePageSlug);
}

export async function generateStaticParams() {
  return VALID_TYPES.map((type) => ({
    type,
  }));
}

export async function generateMetadata({ params }: TypePageProps): Promise<Metadata> {
  const { type } = params;

  if (!isValidTypeSlug(type)) {
    return {
      title: 'Not Found',
    };
  }

  const content = TYPE_CONTENT[type];
  const canonicalUrl = `https://soakmap.com/type/${type}`;

  return {
    title: content.title,
    description: content.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: content.title,
      description: content.metaDescription,
      type: 'website',
      url: canonicalUrl,
      siteName: 'SoakMap',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.metaDescription,
    },
  };
}

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

export default async function TypePage({ params }: TypePageProps) {
  const { type } = params;

  // Validate type slug
  if (!isValidTypeSlug(type)) {
    notFound();
  }

  const content = TYPE_CONTENT[type];
  const springType = getSpringTypeFromSlug(type);

  // Get stats for hero
  const statsResult = await db.getStats();
  if (!statsResult.ok) {
    console.error(`[Type Page: ${type}] Failed to load stats:`, statsResult.error);
  }
  const stats = statsResult.ok ? statsResult.data : FALLBACK_STATS;

  // Determine spring count based on type
  const springCount =
    springType === 'hot' ? stats.hot : springType === 'warm' ? stats.warm : stats.cold;

  // Get featured springs (16 for grid, first 6 for fallback)
  const springsResult = await db.getSprings({ spring_type: springType, limit: 16 });
  if (!springsResult.ok) {
    console.error(`[Type Page: ${type}] Failed to load springs:`, springsResult.error);
  }
  const featuredSprings = springsResult.ok ? springsResult.data : [];

  // Get all states for quick links
  const statesResult = await db.getStates();
  if (!statesResult.ok) {
    console.error(`[Type Page: ${type}] Failed to load states:`, statesResult.error);
  }
  const states = statesResult.ok ? statesResult.data : [];

  // Get relevant cities for this type
  const cities = getCitiesForType(type, SEED_CITIES);

  // Structured data schemas
  const faqSchema = generateFAQSchema(content.faqs);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://soakmap.com' },
    { name: content.h1, url: `https://soakmap.com/type/${type}` },
  ]);
  const itemListSchema = generateItemListSchema(
    featuredSprings.map((s) => ({ name: s.name, slug: s.slug })),
    `Popular ${content.h1}`
  );

  // State quick links title based on type
  const stateLinksTitle =
    springType === 'hot'
      ? 'Hot Springs by State'
      : springType === 'warm'
        ? 'Warm Springs by State'
        : 'Swimming Holes by State';

  const stateLinksDescription =
    springType === 'hot'
      ? 'Find hot springs in your state or plan a trip to a new destination.'
      : springType === 'warm'
        ? 'Browse warm springs across America by state.'
        : 'Find swimming holes in your state or discover new destinations.';

  // City directory title based on type
  const cityDirectoryTitle =
    springType === 'hot'
      ? 'Find Hot Springs by City'
      : springType === 'warm'
        ? 'Find Warm Springs by City'
        : 'Find Swimming Holes by City';

  const cityDirectoryDescription =
    springType === 'hot'
      ? 'Browse hot springs near major cities across America.'
      : springType === 'warm'
        ? 'Discover warm springs near major cities.'
        : 'Browse swimming holes near major cities across the United States.';

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
        <NearMeHero pageType={type} title={content.h1} intro={content.intro} springCount={springCount} />

        {/* Geolocation + Results */}
        <Suspense fallback={<ResultsSkeleton />}>
          <NearMeResults springType={springType} fallbackSprings={featuredSprings.slice(0, 6)} />
        </Suspense>

        {/* Featured Springs Grid - Static SSR content for SEO */}
        <FeaturedSpringsGrid
          springs={featuredSprings}
          title={`Popular ${content.h1}`}
          description={`Explore some of the most visited ${springType === 'hot' ? 'hot springs' : springType === 'warm' ? 'warm springs' : 'swimming holes'} across the United States.`}
          viewAllHref="/states"
          viewAllLabel="Browse all states"
        />

        {/* State Quick Links */}
        <StateQuickLinks
          states={states}
          title={stateLinksTitle}
          description={stateLinksDescription}
          springType={springType}
        />

        {/* City Directory */}
        <CityDirectory cities={cities} title={cityDirectoryTitle} description={cityDirectoryDescription} />

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
