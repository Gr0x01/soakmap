import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  Car,
  Signal,
  DollarSign,
  Users,
  Calendar,
  Shirt,
  Thermometer,
  Droplets,
  AlertTriangle,
  ChevronLeft,
  ExternalLink,
  Mountain,
  Waves,
} from 'lucide-react';

import { getSpringBySlug, getAllSpringSlugs } from '@/lib/data/springs';
import { db } from '@/lib/supabase';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SpringTypeBadge, ExperienceTypeBadge, Badge } from '@/components/ui/Badge';
import { SpringCard } from '@/components/springs/SpringCard';
import { SingleSpringMap } from '@/components/maps';
import type { Spring, NearbySpring, SpringSummary } from '@/types/spring';

// Revalidate every hour
export const revalidate = 3600;

// Generate static params for top springs
export async function generateStaticParams() {
  const slugs = await getAllSpringSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const spring = await getSpringBySlug(slug);

  if (!spring) {
    return { title: 'Spring Not Found' };
  }

  const typeLabel = spring.spring_type === 'hot' ? 'Hot Spring' : spring.spring_type === 'warm' ? 'Warm Spring' : 'Swimming Hole';
  const title = `${spring.name} - ${typeLabel} in ${spring.state}`;
  const description = spring.description || `Discover ${spring.name}, a ${spring.experience_type} ${typeLabel.toLowerCase()} in ${spring.state}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: spring.photo_url ? [spring.photo_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// Info card component
function InfoCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  subValue?: string;
}) {
  if (!value) return null;

  return (
    <div className="bg-cream rounded-xl p-4 border border-forest/10 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-forest/5">
          <Icon className="w-5 h-5 text-forest" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-bark/60 font-body">{label}</p>
          <p className="font-display font-semibold text-forest">{value}</p>
          {subValue && <p className="text-sm text-bark/50 mt-0.5">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

// Warning badge component
function WarningBadge({ warning }: { warning: string }) {
  const labels: Record<string, string> = {
    strong_current: 'Strong Current',
    cold_shock: 'Cold Shock Risk',
    high_temperature: 'High Temperature',
    cliff_edges: 'Cliff Edges',
    no_lifeguard: 'No Lifeguard',
    wildlife_bears: 'Bear Activity',
    wildlife_snakes: 'Snakes Present',
    remote_no_help: 'Remote Location',
    seasonal_closure: 'Seasonal Closures',
    flash_flood_risk: 'Flash Flood Risk',
    slippery_rocks: 'Slippery Rocks',
  };

  return (
    <Badge variant="default" className="bg-terracotta/10 text-terracotta border-terracotta/20">
      <AlertTriangle className="w-3 h-3 mr-1" />
      {labels[warning] || warning}
    </Badge>
  );
}

// Format enum values for display
function formatEnumValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// Get Google Maps directions URL
function getDirectionsUrl(spring: Spring): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${spring.lat},${spring.lng}`;
}

// Convert nearby springs to SpringSummary for display
function nearbyToSummary(nearby: NearbySpring): SpringSummary {
  return {
    id: nearby.id,
    name: nearby.name,
    slug: nearby.slug,
    state: nearby.state,
    lat: 0, // Not needed for card display
    lng: 0,
    spring_type: nearby.spring_type,
    experience_type: nearby.experience_type,
    photo_url: null,
  };
}

export default async function SpringDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spring = await getSpringBySlug(slug);

  if (!spring) {
    notFound();
  }

  // Fetch nearby springs
  const nearbyResult = await db.getNearby(spring.lat, spring.lng, 100, 6);
  const nearbySprings = nearbyResult.ok
    ? nearbyResult.data.filter((s) => s.id !== spring.id).slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-stone">
      <Header />

      <main className="pt-8 pb-20">
        {/* Breadcrumb */}
        <div className="container-brutal mb-6">
          <Link
            href={`/states/${spring.state.toLowerCase()}`}
            className="inline-flex items-center gap-2 text-bark/60 hover:text-forest transition-colors font-body text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {spring.state} Springs
          </Link>
        </div>

        {/* Hero section */}
        <div className="container-brutal">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left column - Photo/placeholder and map */}
            <div className="space-y-6">
              {/* Photo area */}
              <div
                className={`aspect-[4/3] rounded-2xl overflow-hidden relative ${
                  spring.spring_type === 'hot'
                    ? 'bg-gradient-to-br from-terracotta/20 via-terracotta/10 to-sand/30'
                    : spring.spring_type === 'warm'
                    ? 'bg-gradient-to-br from-moss/20 via-moss/10 to-sand/30'
                    : 'bg-gradient-to-br from-river/20 via-river/10 to-sand/30'
                }`}
              >
                {spring.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={spring.photo_url}
                    alt={spring.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div
                        className={`w-24 h-24 mx-auto mb-4 rounded-full blur-2xl opacity-50 ${
                          spring.spring_type === 'hot'
                            ? 'bg-terracotta'
                            : spring.spring_type === 'warm'
                            ? 'bg-moss'
                            : 'bg-river'
                        }`}
                      />
                      {spring.spring_type === 'cold' ? (
                        <Waves className="w-16 h-16 mx-auto text-river/40" />
                      ) : (
                        <Mountain className="w-16 h-16 mx-auto text-forest/30" />
                      )}
                    </div>
                  </div>
                )}

                {/* Badges overlay */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <SpringTypeBadge type={spring.spring_type} />
                  <ExperienceTypeBadge type={spring.experience_type} />
                </div>
              </div>

              {/* Interactive map */}
              <div className="aspect-video rounded-xl overflow-hidden shadow-soft border border-forest/10">
                <SingleSpringMap
                  lat={spring.lat}
                  lng={spring.lng}
                  name={spring.name}
                  springType={spring.spring_type}
                />
              </div>
            </div>

            {/* Right column - Details */}
            <div className="space-y-6">
              {/* Title and location */}
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-3 leading-tight">
                  {spring.name}
                </h1>
                <div className="flex items-center gap-2 text-bark/70 font-body">
                  <MapPin className="w-5 h-5" />
                  <span>{spring.state}</span>
                  {spring.temp_f && (
                    <>
                      <span className="text-bark/30">•</span>
                      <Thermometer className="w-4 h-4" />
                      <span>{spring.temp_f}°F</span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-lg text-bark/80 font-body leading-relaxed">
                {spring.description}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                  <a
                  href={getDirectionsUrl(spring)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-display font-semibold tracking-wide rounded-lg shadow-soft bg-forest text-cream hover:bg-forest/90 hover-lift hover-press focus-natural transition-all duration-300"
                >
                  <Navigation className="w-5 h-5" />
                  Get Directions
                  <ExternalLink className="w-4 h-4 opacity-60" />
                </a>
              </div>

              {/* Warnings */}
              {spring.warnings && spring.warnings.length > 0 && (
                <div className="bg-terracotta/5 rounded-xl p-4 border border-terracotta/20">
                  <h3 className="font-display font-semibold text-terracotta mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Safety Warnings
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {spring.warnings.map((warning) => (
                      <WarningBadge key={warning} warning={warning} />
                    ))}
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <InfoCard
                  icon={Mountain}
                  label="Access"
                  value={formatEnumValue(spring.access_difficulty)}
                  subValue={
                    spring.time_from_parking_min
                      ? `${spring.time_from_parking_min} min from parking`
                      : undefined
                  }
                />
                <InfoCard
                  icon={Car}
                  label="Parking"
                  value={formatEnumValue(spring.parking)}
                />
                <InfoCard
                  icon={DollarSign}
                  label="Fee"
                  value={
                    spring.fee_type === 'free'
                      ? 'Free'
                      : spring.fee_type === 'paid' && spring.fee_amount_usd
                      ? `$${spring.fee_amount_usd}`
                      : formatEnumValue(spring.fee_type)
                  }
                />
                <InfoCard
                  icon={Signal}
                  label="Cell Service"
                  value={formatEnumValue(spring.cell_service)}
                />
                <InfoCard
                  icon={Users}
                  label="Crowds"
                  value={formatEnumValue(spring.crowd_level)}
                />
                <InfoCard
                  icon={Calendar}
                  label="Best Season"
                  value={formatEnumValue(spring.best_season)}
                />
                {spring.spring_type === 'hot' && (
                  <>
                    <InfoCard
                      icon={Shirt}
                      label="Clothing"
                      value={
                        spring.clothing_optional === 'yes'
                          ? 'Clothing Optional'
                          : spring.clothing_optional === 'unofficial'
                          ? 'Unofficially Optional'
                          : spring.clothing_optional === 'no'
                          ? 'Required'
                          : null
                      }
                    />
                    <InfoCard
                      icon={Droplets}
                      label="Pools"
                      value={spring.pool_count ? `${spring.pool_count} pools` : null}
                    />
                  </>
                )}
                {spring.spring_type === 'cold' && (
                  <>
                    <InfoCard
                      icon={Droplets}
                      label="Water Clarity"
                      value={formatEnumValue(spring.water_clarity)}
                    />
                    {spring.cliff_jumping && (
                      <InfoCard
                        icon={Mountain}
                        label="Cliff Jumping"
                        value="Yes"
                        subValue={
                          spring.cliff_heights_ft
                            ? `${spring.cliff_heights_ft.join(', ')} ft`
                            : undefined
                        }
                      />
                    )}
                    {spring.waterfall && (
                      <InfoCard icon={Waves} label="Waterfall" value="Yes" />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nearby springs */}
        {nearbySprings.length > 0 && (
          <section className="container-brutal mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-forest">
                Nearby Springs
              </h2>
              <Link
                href={`/states/${spring.state.toLowerCase()}`}
                className="text-forest hover:text-terracotta transition-colors font-display font-medium text-sm"
              >
                View all in {spring.state} →
              </Link>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {nearbySprings.map((nearby) => (
                <div key={nearby.id} className="relative">
                  <SpringCard spring={nearbyToSummary(nearby)} />
                  <div className="absolute top-3 right-3 bg-cream/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-display font-medium text-bark/70 border border-forest/10">
                    {nearby.distance_miles.toFixed(1)} mi
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
