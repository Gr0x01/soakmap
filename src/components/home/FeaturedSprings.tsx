import Link from 'next/link';
import { ArrowRight, MapPin, Footprints, Mountain, Building2, Thermometer } from 'lucide-react';
import { getFeaturedSprings } from '@/lib/data/springs';
import { cn } from '@/lib/utils';
import type { SpringSummary } from '@/types/spring';

// Get top states for the "Explore by State" section
async function getTopStates() {
  // Import db here to avoid circular deps
  const { db } = await import('@/lib/supabase');
  const result = await db.getStates();
  if (!result.ok) return [];

  // Sort by spring count and take top 12
  return result.data
    .sort((a, b) => b.spring_count - a.spring_count)
    .slice(0, 12);
}

export async function FeaturedSprings() {
  const [springs, topStates] = await Promise.all([
    getFeaturedSprings(6),
    getTopStates(),
  ]);

  return (
    <>
      {/* ================================================================
          FEATURED SPRINGS - Typography-focused cards
          ================================================================ */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="container-brutal">
          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <div>
              <p className="font-display text-terracotta text-sm tracking-widest uppercase mb-3">
                Hand-picked destinations
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest leading-tight">
                Popular springs
              </h2>
            </div>
            <Link
              href="/springs"
              className="group inline-flex items-center gap-2 text-forest font-display font-semibold hover:text-terracotta transition-colors"
            >
              View all springs
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Springs grid - Editorial card design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {springs.map((spring, index) => (
              <FeaturedSpringCard key={spring.id} spring={spring} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          EXPERIENCE TYPES - Resort vs Primitive
          ================================================================ */}
      <section className="py-20 md:py-28 bg-stone">
        <div className="container-brutal">
          {/* Section header */}
          <div className="text-center mb-12 md:mb-16">
            <p className="font-display text-moss text-sm tracking-widest uppercase mb-3">
              Find your style
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
              What kind of adventure?
            </h2>
            <p className="font-body text-bark/60 text-lg max-w-2xl mx-auto">
              From developed resorts with amenities to wild primitive springs off the beaten path.
            </p>
          </div>

          {/* Experience type cards */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Resort */}
            <Link
              href="/springs?experience_type=resort"
              className="group relative bg-cream rounded-2xl p-8 border border-forest/10 hover:border-forest/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-sand/50 flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-forest" />
              </div>
              <h3 className="font-display text-2xl font-bold text-forest mb-3 group-hover:text-terracotta transition-colors">
                Resort
              </h3>
              <p className="font-body text-bark/60 leading-relaxed mb-6">
                Developed facilities with changing rooms, showers, and amenities. Perfect for first-timers or those seeking comfort.
              </p>
              <ul className="space-y-2 text-sm text-bark/50 font-body mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                  Easy access, often drive-up
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                  Typically paid admission
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                  Family-friendly options
                </li>
              </ul>
              <span className="inline-flex items-center gap-2 text-forest font-display font-semibold text-sm group-hover:text-terracotta group-hover:gap-3 transition-all">
                Browse resorts
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            {/* Primitive */}
            <Link
              href="/springs?experience_type=primitive"
              className="group relative bg-cream rounded-2xl p-8 border border-forest/10 hover:border-forest/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-moss/20 flex items-center justify-center mb-6">
                <Mountain className="w-8 h-8 text-forest" />
              </div>
              <h3 className="font-display text-2xl font-bold text-forest mb-3 group-hover:text-terracotta transition-colors">
                Primitive
              </h3>
              <p className="font-body text-bark/60 leading-relaxed mb-6">
                Natural, undeveloped springs in their wild state. For adventurers seeking authentic experiences.
              </p>
              <ul className="space-y-2 text-sm text-bark/50 font-body mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                  Often requires hiking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                  Usually free access
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                  Clothing optional possible
                </li>
              </ul>
              <span className="inline-flex items-center gap-2 text-forest font-display font-semibold text-sm group-hover:text-terracotta group-hover:gap-3 transition-all">
                Browse primitive
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            {/* Hybrid */}
            <Link
              href="/springs?experience_type=hybrid"
              className="group relative bg-cream rounded-2xl p-8 border border-forest/10 hover:border-forest/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-river/20 flex items-center justify-center mb-6">
                <Footprints className="w-8 h-8 text-forest" />
              </div>
              <h3 className="font-display text-2xl font-bold text-forest mb-3 group-hover:text-terracotta transition-colors">
                Hybrid
              </h3>
              <p className="font-body text-bark/60 leading-relaxed mb-6">
                Light development while maintaining natural character. The best of both worlds.
              </p>
              <ul className="space-y-2 text-sm text-bark/50 font-body mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-river" />
                  Basic amenities available
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-river" />
                  Natural pools preserved
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-river" />
                  Moderate accessibility
                </li>
              </ul>
              <span className="inline-flex items-center gap-2 text-forest font-display font-semibold text-sm group-hover:text-terracotta group-hover:gap-3 transition-all">
                Browse hybrid
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          EXPLORE BY STATE - Grid of top states
          ================================================================ */}
      {topStates.length > 0 && (
        <section className="py-20 md:py-28 bg-forest">
          <div className="container-brutal">
            {/* Section header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
              <div>
                <p className="font-display text-moss text-sm tracking-widest uppercase mb-3">
                  Explore by region
                </p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-cream leading-tight">
                  Top states for springs
                </h2>
              </div>
              <Link
                href="/states"
                className="group inline-flex items-center gap-2 text-cream/70 font-display font-semibold hover:text-cream transition-colors"
              >
                All states
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* States grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {topStates.map((state) => (
                <Link
                  key={state.code}
                  href={`/${state.code.toLowerCase()}`}
                  className="group relative bg-cream/5 hover:bg-cream/10 border border-cream/10 hover:border-cream/20 rounded-xl p-5 transition-all duration-300"
                >
                  <h3 className="font-display text-lg font-bold text-cream group-hover:text-terracotta transition-colors mb-1">
                    {state.name}
                  </h3>
                  <p className="text-cream/50 text-sm font-body">
                    {state.spring_count} springs
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

// ================================================================
// Featured Spring Card - Typography-focused, no photo dependency
// ================================================================

interface FeaturedSpringCardProps {
  spring: SpringSummary;
  index: number;
}

function FeaturedSpringCard({ spring, index }: FeaturedSpringCardProps) {
  // Color based on spring type
  const typeColors = {
    hot: {
      bg: 'bg-terracotta/5',
      border: 'border-terracotta/20 hover:border-terracotta/40',
      accent: 'bg-terracotta',
      text: 'text-terracotta',
      icon: 'bg-terracotta/10',
    },
    warm: {
      bg: 'bg-moss/5',
      border: 'border-moss/20 hover:border-moss/40',
      accent: 'bg-moss',
      text: 'text-moss',
      icon: 'bg-moss/10',
    },
    cold: {
      bg: 'bg-river/5',
      border: 'border-river/20 hover:border-river/40',
      accent: 'bg-river',
      text: 'text-river',
      icon: 'bg-river/10',
    },
  };

  const colors = typeColors[spring.spring_type] || typeColors.hot;

  return (
    <Link
      href={`/springs/${spring.slug}`}
      className={cn(
        'group relative rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg',
        colors.bg,
        colors.border
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Temperature badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full',
          colors.icon
        )}>
          <Thermometer className={cn('w-4 h-4', colors.text)} />
          <span className={cn('font-display font-semibold text-sm', colors.text)}>
            {spring.temp_f ? `${Math.round(spring.temp_f)}°F` : spring.spring_type}
          </span>
        </div>
        <span className="text-xs font-display font-medium text-bark/40 uppercase tracking-wide">
          {spring.experience_type}
        </span>
      </div>

      {/* Name - THE focal point */}
      <h3 className="font-display text-xl md:text-2xl font-bold text-forest leading-tight mb-2 group-hover:text-terracotta transition-colors">
        {spring.name}
      </h3>

      {/* Location */}
      <p className="flex items-center gap-1.5 text-bark/50 text-sm font-body mb-4">
        <MapPin className="w-3.5 h-3.5" />
        {spring.state}
      </p>

      {/* Quick info chips */}
      <div className="flex flex-wrap gap-2">
        {spring.access_difficulty && spring.access_difficulty !== 'drive_up' && (
          <span className="inline-flex items-center gap-1 text-xs text-bark/50 bg-stone/80 px-2 py-1 rounded-full font-body">
            <Footprints className="w-3 h-3" />
            {spring.access_difficulty === 'short_walk' ? 'Short walk' :
             spring.access_difficulty === 'moderate_hike' ? 'Hike' : 'Long hike'}
          </span>
        )}
        {spring.fee_type && spring.fee_type !== 'unknown' && (
          <span className={cn(
            'inline-flex items-center text-xs px-2 py-1 rounded-full font-body',
            spring.fee_type === 'free' ? 'text-moss bg-moss/10' : 'text-bark/50 bg-stone/80'
          )}>
            {spring.fee_type === 'free' ? 'Free' : spring.fee_type === 'paid' ? 'Paid' : 'Donation'}
          </span>
        )}
      </div>

      {/* Hover arrow */}
      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className={cn('w-5 h-5', colors.text)} />
      </div>
    </Link>
  );
}
