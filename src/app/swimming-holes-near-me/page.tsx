import { Suspense } from 'react';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';

import { db } from '@/lib/supabase';
import { safeJsonLd, generateBreadcrumbSchema } from '@/lib/schema';
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

const PAGE_TYPE = 'swimming-holes';
const content = NEAR_ME_CONTENT[PAGE_TYPE];

export const metadata: Metadata = {
  title: content.title,
  description: content.metaDescription,
  alternates: {
    canonical: 'https://soakmap.com/swimming-holes-near-me',
  },
  openGraph: {
    title: content.title,
    description: content.metaDescription,
    type: 'website',
    url: 'https://soakmap.com/swimming-holes-near-me',
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

export default async function SwimmingHolesNearMePage() {
  // Get stats for hero
  const statsResult = await db.getStats();
  const stats = statsResult.ok ? statsResult.data : { total: 2900, hot: 1500, warm: 400, cold: 1000 };

  // Get featured cold springs (more for static content)
  const springsResult = await db.getSprings({ spring_type: 'cold', limit: 16 });
  const featuredSprings = springsResult.ok ? springsResult.data : [];

  // Get all states for quick links
  const statesResult = await db.getStates();
  const states = statesResult.ok ? statesResult.data : [];

  // Get relevant cities
  const cities = getCitiesForSpringType(PAGE_TYPE, SEED_CITIES);

  // Structured data schemas
  const faqSchema = generateFAQSchema(content.faqs);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://soakmap.com' },
    { name: 'Swimming Holes Near Me', url: 'https://soakmap.com/swimming-holes-near-me' },
  ]);

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

      <main id="main-content" className="pt-8 pb-20">
        {/* Hero */}
        <NearMeHero
          pageType={PAGE_TYPE}
          title={content.h1}
          intro={content.intro}
          springCount={stats.cold}
        />

        {/* Geolocation + Results */}
        <Suspense fallback={<ResultsSkeleton />}>
          <NearMeResults springType="cold" fallbackSprings={featuredSprings.slice(0, 6)} />
        </Suspense>

        {/* Featured Springs Grid - Static SSR content for SEO */}
        <FeaturedSpringsGrid
          springs={featuredSprings}
          title="Popular Swimming Holes"
          description="Discover the best natural swimming spots across the United States."
          viewAllHref="/states"
          viewAllLabel="Browse all states"
        />

        {/* State Quick Links */}
        <StateQuickLinks
          states={states}
          title="Swimming Holes by State"
          description="Find swimming holes in your state or discover new destinations."
          springType="cold"
        />

        {/* City Directory */}
        <CityDirectory
          cities={cities}
          title="Find Swimming Holes by City"
          description="Browse swimming holes and natural swimming spots near major cities."
        />

        {/* Editorial Content for SEO */}
        <EditorialContent content={content.editorial} />

        {/* FAQ Section */}
        <NearMeFAQ faqs={content.faqs} />
      </main>

      <Footer />
    </div>
  );
}
