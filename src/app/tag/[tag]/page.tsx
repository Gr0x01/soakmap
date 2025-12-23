import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock } from 'lucide-react';

import { db } from '@/lib/supabase';
import { safeJsonLd, generateBreadcrumbSchema, generateItemListSchema } from '@/lib/schema';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  FeaturedSpringsGrid,
  EditorialContent,
  NearMeFAQ,
  generateFAQSchema,
} from '@/components/near-me';
import { getTagContent, VALID_TAG_SLUGS } from '@/lib/data/tag-content';
import type { SpringSummary } from '@/types';

// ISR: Revalidate every hour
export const revalidate = 3600;

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

// Generate static params for all valid tags
export async function generateStaticParams() {
  return VALID_TAG_SLUGS.map((tag) => ({ tag }));
}

// Generate metadata
export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const content = getTagContent(tag);

  if (!content) {
    return {
      title: 'Tag Not Found',
    };
  }

  const canonicalUrl = `https://soakmap.com/tag/${tag}`;

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

/**
 * Calculate state breakdown from springs
 */
function getStateBreakdown(springs: SpringSummary[]): Array<{ state: string; count: number }> {
  const stateCounts = springs.reduce((acc, spring) => {
    acc[spring.state] = (acc[spring.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(stateCounts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const content = getTagContent(tag);

  // 404 if invalid tag
  if (!content) {
    notFound();
  }

  // Fetch springs matching this tag
  const springsResult = await db.getSpringsByTag(tag);
  if (!springsResult.ok) {
    console.error(`[Tag/${tag}] Failed to load springs:`, springsResult.error);
  }
  const springs = springsResult.ok ? springsResult.data : [];

  // Get state breakdown
  const stateBreakdown = getStateBreakdown(springs);
  const topStates = stateBreakdown.slice(0, 10);

  // Structured data schemas
  const faqSchema = generateFAQSchema(content.faqs);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://soakmap.com' },
    { name: content.h1, url: `https://soakmap.com/tag/${tag}` },
  ]);
  const itemListSchema = generateItemListSchema(
    springs.slice(0, 50).map((s) => ({ name: s.name, slug: s.slug })),
    content.h1
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
        {/* Hero Section */}
        <div className="container-brutal mb-12">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 border border-forest/10 bg-gradient-to-br from-forest/5 via-transparent to-sand/20">
            {/* Decorative blurs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-moss/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-sand/20 blur-3xl" />

            <div className="relative">
              {/* Tag label */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest font-body text-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-moss" />
                <span>{springs.length.toLocaleString()} springs</span>
              </div>

              {/* H1 */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest mb-4 leading-tight">
                {content.h1}
              </h1>

              {/* Intro paragraph */}
              <p className="text-lg text-bark/70 font-body max-w-3xl leading-relaxed mb-6">
                {content.intro}
              </p>

              {/* State breakdown summary */}
              {topStates.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-bark/60 font-body">Top states:</span>
                  {topStates.slice(0, 5).map((item) => (
                    <Link
                      key={item.state}
                      href={`/${item.state.toLowerCase()}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cream/50 text-bark/80 text-sm font-body hover:bg-forest/10 hover:text-forest transition-colors"
                    >
                      <span className="font-medium">{item.state}</span>
                      <span className="text-bark/40">({item.count})</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Springs Grid */}
        <FeaturedSpringsGrid
          springs={springs.slice(0, 24)}
          title={`Browse ${content.h1}`}
          description={`Discover ${springs.length.toLocaleString()} natural springs matching this category.`}
          viewAllHref="/states"
          viewAllLabel="Browse all states"
        />

        {/* State Breakdown Section */}
        {stateBreakdown.length > 0 && (
          <section className="container-brutal py-12 border-t border-forest/10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-forest mb-6">
              Springs by State
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
              {stateBreakdown.map((item) => (
                <Link
                  key={item.state}
                  href={`/${item.state.toLowerCase()}`}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border border-forest/10 bg-cream/30 hover:bg-cream/50 hover:border-forest/20 transition-colors"
                  role="listitem"
                  aria-label={`${item.state}: ${item.count} ${item.count === 1 ? 'spring' : 'springs'}`}
                >
                  <span className="font-display font-semibold text-forest">{item.state}</span>
                  <span className="text-bark/60 font-body text-sm">
                    {item.count} {item.count === 1 ? 'spring' : 'springs'}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

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
