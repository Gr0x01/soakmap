import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MapPin } from 'lucide-react';

import { db } from '@/lib/supabase';
import {
  getSpringTypeFromFilter,
  getFilterLabel,
  getStateTypeTitle,
  getStateTypeContent,
  isValidFilterType,
  FILTER_TYPES,
  type FilterType,
} from '@/lib/data/state-type-content';
import { generateBreadcrumbSchema, safeJsonLd } from '@/lib/schema';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SpringGrid } from '@/components/springs/SpringCard';
import { SpringMap } from '@/components/maps';
import { EditorialContent } from '@/components/near-me/EditorialContent';
import { cn, getStateName, isValidStateCode } from '@/lib/utils';

// Revalidate every 24 hours - data rarely changes
export const revalidate = 86400;

// Generate static params for all state + filter combos with springs
export async function generateStaticParams() {
  const result = await db.getStates();
  if (!result.ok) return [];

  const params: { state: string; filter: string }[] = [];

  // For each state, generate params for filters that have springs
  for (const state of result.data) {
    const stateCode = state.code.toLowerCase();

    // Add params for each filter type that has springs
    if (state.hot_count > 0) {
      params.push({ state: stateCode, filter: 'hot-springs' });
    }
    if (state.warm_count > 0) {
      params.push({ state: stateCode, filter: 'warm-springs' });
    }
    if (state.cold_count > 0) {
      params.push({ state: stateCode, filter: 'swimming-holes' });
    }
  }

  return params;
}

// Generate metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; filter: string }>;
}): Promise<Metadata> {
  const { state, filter } = await params;
  const stateCode = state.toUpperCase();

  if (!isValidStateCode(stateCode) || !isValidFilterType(filter)) {
    return { title: 'Page Not Found' };
  }

  const stateName = getStateName(stateCode);

  const result = await db.getStateByCode(stateCode);
  const stateData = result.ok ? result.data : null;

  const springType = getSpringTypeFromFilter(filter as FilterType);
  const filterLabel = getFilterLabel(filter as FilterType);

  // Get count for this specific type
  let count = 0;
  if (stateData) {
    switch (springType) {
      case 'hot':
        count = stateData.hot_count;
        break;
      case 'warm':
        count = stateData.warm_count;
        break;
      case 'cold':
        count = stateData.cold_count;
        break;
    }
  }

  const title = getStateTypeTitle(stateName, filter as FilterType);
  const description = `Discover ${count} ${filterLabel.toLowerCase()} in ${stateName}. Detailed access info, amenities, and seasonal recommendations for each location.`;
  const url = `https://soakmap.com/${state.toLowerCase()}/${filter}`;

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

export default async function StateFilterPage({
  params,
}: {
  params: Promise<{ state: string; filter: string }>;
}) {
  const { state, filter } = await params;
  const stateCode = state.toUpperCase();

  // Validate state and filter
  if (!isValidStateCode(stateCode) || !isValidFilterType(filter)) {
    notFound();
  }

  const stateName = getStateName(stateCode);

  const springType = getSpringTypeFromFilter(filter as FilterType);

  // Fetch state data and springs in parallel
  const [stateResult, springsResult] = await Promise.all([
    db.getStateByCode(stateCode),
    db.getSpringsByState(stateCode),
  ]);

  const stateData = stateResult.ok ? stateResult.data : null;
  const allSprings = springsResult.ok ? springsResult.data : [];

  // Filter by spring type
  const springs = allSprings.filter((s) => s.spring_type === springType);

  // Get counts for filter chips
  const hotCount = stateData?.hot_count || allSprings.filter((s) => s.spring_type === 'hot').length;
  const warmCount = stateData?.warm_count || allSprings.filter((s) => s.spring_type === 'warm').length;
  const coldCount = stateData?.cold_count || allSprings.filter((s) => s.spring_type === 'cold').length;

  const filterCounts = {
    'hot-springs': hotCount,
    'warm-springs': warmCount,
    'swimming-holes': coldCount,
  };

  const title = getStateTypeTitle(stateName, filter as FilterType);
  const content = getStateTypeContent(stateName, filter as FilterType, springs.length);

  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://soakmap.com' },
    { name: stateName, url: `https://soakmap.com/${state.toLowerCase()}` },
    { name: getFilterLabel(filter as FilterType), url: `https://soakmap.com/${state.toLowerCase()}/${filter}` },
  ]);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-stone">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />

      <Header />

      <main className="pt-8 pb-20">
        {/* Breadcrumb */}
        <div className="container-brutal mb-6">
          <div className="flex items-center gap-2 text-bark/60 font-body text-sm">
            <Link
              href="/"
              className="hover:text-forest transition-colors"
            >
              All States
            </Link>
            <span>/</span>
            <Link
              href={`/${state}`}
              className="hover:text-forest transition-colors"
            >
              {stateName}
            </Link>
          </div>
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
                <span>{stateName}</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest mb-6 leading-tight">
                {title}
              </h1>

              <p className="text-lg text-bark/70 font-body max-w-2xl">
                {content.intro}
              </p>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="container-brutal mb-8">
          <div className="bg-cream rounded-xl p-4 border border-forest/10 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-bark/60 font-body mr-1">Type:</span>
              {FILTER_TYPES.map((filterType) => {
                const isActive = filterType === filter;
                const count = filterCounts[filterType];
                const label = getFilterLabel(filterType);

                if (count === 0) return null;

                return (
                  <Link
                    key={filterType}
                    href={`/${state}/${filterType}`}
                    className={cn(
                      'px-3 py-1.5 font-display text-sm font-semibold',
                      'rounded-lg border transition-all duration-200',
                      'hover-press shadow-soft focus-natural',
                      isActive
                        ? filterType === 'hot-springs'
                          ? 'bg-terracotta text-cream border-terracotta'
                          : filterType === 'warm-springs'
                            ? 'bg-moss text-cream border-moss'
                            : 'bg-river text-cream border-river'
                        : 'bg-cream text-forest border-forest/20 hover:border-forest/40'
                    )}
                  >
                    {label} ({count})
                  </Link>
                );
              })}

              <span className="w-px h-6 bg-forest/20 mx-1" aria-hidden="true" />

              <Link
                href={`/${state}`}
                className="px-3 py-1.5 text-sm text-bark/60 hover:text-terracotta transition-colors font-body focus-natural rounded"
              >
                View all types
              </Link>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="container-brutal mb-6">
          <p className="text-bark/60 font-body">
            Showing <span className="font-semibold text-forest">{springs.length}</span>{' '}
            {springs.length === 1 ? 'result' : 'results'}
          </p>
        </div>

        {/* Springs grid */}
        <div className="container-brutal">
          {springs.length > 0 ? (
            <SpringGrid springs={springs} />
          ) : (
            <div className="bg-cream rounded-xl p-12 text-center border border-forest/10">
              <h3 className="font-display text-xl font-semibold text-forest mb-2">
                No springs found
              </h3>
              <p className="text-bark/60 font-body mb-4">
                There are no {getFilterLabel(filter as FilterType).toLowerCase()} in {stateName}.
              </p>
              <Link
                href={`/${state}`}
                className="inline-flex items-center gap-2 text-forest hover:text-terracotta transition-colors font-display font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                View all springs in {stateName}
              </Link>
            </div>
          )}
        </div>

        {/* Interactive map */}
        {springs.length > 0 && (
          <div className="container-brutal mt-12">
            <h2 className="font-display text-2xl font-bold text-forest mb-6">
              Map View
            </h2>
            <div className="aspect-[16/9] rounded-xl overflow-hidden shadow-soft border border-forest/10">
              <SpringMap springs={springs} />
            </div>
          </div>
        )}

        {/* Editorial content */}
        <EditorialContent content={content.editorial} className="mt-16" />

        {/* FAQ section */}
        <section className="container-brutal py-10">
          <h2 className="font-display text-2xl font-bold text-forest mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {content.faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-cream rounded-xl p-6 border border-forest/10 shadow-soft"
              >
                <h3 className="font-display text-lg font-semibold text-forest mb-3">
                  {faq.question}
                </h3>
                <p className="text-bark/70 font-body leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
