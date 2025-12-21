'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Navigation, AlertCircle } from 'lucide-react';
import { SpringCard } from '@/components/springs/SpringCard';
import type { NearbySpring, SpringType, SpringSummary } from '@/types/spring';

// =============================================================================
// Constants
// =============================================================================

const GEOLOCATION_CONFIG = {
  TIMEOUT_MS: 15000,
  CACHE_MAX_AGE_MS: 300000, // 5 minutes
  FETCH_LIMIT: 30,
} as const;

const DISTANCE_BANDS = [
  { label: 'Within 25 miles', min: 0, max: 25 },
  { label: '25-50 miles', min: 25, max: 50 },
  { label: '50-100 miles', min: 50, max: 100 },
] as const;

const STORAGE_KEY = 'soakmap-geo-permission';

// =============================================================================
// Types
// =============================================================================

type GeoStatus = 'idle' | 'asking' | 'loading' | 'granted' | 'denied' | 'error';

interface NearMeResultsProps {
  springType?: SpringType;
  fallbackSprings: SpringSummary[];
}

interface DistanceBand {
  label: string;
  min: number;
  max: number;
  springs: NearbySpring[];
}

// =============================================================================
// Helpers
// =============================================================================

function groupByDistance(springs: NearbySpring[]): DistanceBand[] {
  const bands: DistanceBand[] = DISTANCE_BANDS.map((band) => ({
    ...band,
    springs: [],
  }));

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

function getSpringTypeLabel(springType?: SpringType): string {
  if (!springType) return 'hot springs and swimming holes';
  if (springType === 'hot') return 'hot springs';
  if (springType === 'cold') return 'swimming holes';
  return `${springType} springs`;
}

// =============================================================================
// Component
// =============================================================================

export function NearMeResults({ springType, fallbackSprings }: NearMeResultsProps) {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [springs, setSprings] = useState<NearbySpring[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Ref for focus management after successful load
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by your browser.');
      setStatusMessage('Error: Geolocation not supported');
      return;
    }

    setStatus('asking');
    setStatusMessage('Requesting your location...');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: GEOLOCATION_CONFIG.TIMEOUT_MS,
          maximumAge: GEOLOCATION_CONFIG.CACHE_MAX_AGE_MS,
        });
      });

      // Store permission for future visits (session only for privacy)
      sessionStorage.setItem(STORAGE_KEY, 'granted');
      setStatus('loading');
      setStatusMessage('Finding springs near you...');

      // Fetch nearby springs
      const params = new URLSearchParams({
        lat: position.coords.latitude.toString(),
        lng: position.coords.longitude.toString(),
        limit: GEOLOCATION_CONFIG.FETCH_LIMIT.toString(),
      });

      if (springType) {
        params.set('type', springType);
      }

      const response = await fetch(`/api/nearby?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch nearby springs');
      }

      const foundSprings = data.springs || [];
      setSprings(foundSprings);
      setStatus('granted');
      setStatusMessage(
        foundSprings.length > 0
          ? `Found ${foundSprings.length} ${getSpringTypeLabel(springType)} near you`
          : `No ${getSpringTypeLabel(springType)} found within 100 miles`
      );

      // Move focus to results heading for screen readers
      setTimeout(() => {
        resultsHeadingRef.current?.focus();
      }, 100);
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          sessionStorage.removeItem(STORAGE_KEY);
          setStatusMessage('Location access denied');
        } else {
          setStatus('error');
          setErrorMessage('Unable to determine your location. Please try again.');
          setStatusMessage('Error getting location');
        }
      } else {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
        setStatusMessage('Error loading springs');
      }
    }
  }, [springType]);

  // Check for previous permission on mount (use sessionStorage for privacy)
  useEffect(() => {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached === 'granted') {
      requestLocation();
    }
  }, [requestLocation]);

  const springTypeLabel = getSpringTypeLabel(springType);

  // Idle state - show CTA
  if (status === 'idle') {
    return (
      <section className="container-brutal py-8" aria-labelledby="geo-cta-heading">
        <div className="bg-gradient-to-br from-forest/5 to-sand/30 rounded-2xl p-8 md:p-12 border border-forest/10 text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest/10 flex items-center justify-center"
            aria-hidden="true"
          >
            <Navigation className="w-8 h-8 text-forest" />
          </div>
          <h2 id="geo-cta-heading" className="font-display text-2xl md:text-3xl font-bold text-forest mb-3">
            Find Springs Near You
          </h2>
          <p className="text-bark/70 font-body max-w-md mx-auto mb-6">
            Enable location to see {springTypeLabel} closest to your current location.
          </p>
          <button
            onClick={requestLocation}
            aria-label={`Enable location services to find ${springTypeLabel} near you`}
            className="inline-flex items-center gap-2 bg-forest text-cream px-6 py-3 rounded-lg font-display font-semibold hover:bg-forest/90 transition-colors focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2"
          >
            <Navigation className="w-5 h-5" aria-hidden="true" />
            Enable Location
          </button>
        </div>

        {/* Show fallback springs below CTA */}
        {fallbackSprings.length > 0 && (
          <div className="mt-12">
            <h3 className="font-display text-xl font-bold text-forest mb-4">Popular Springs</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Popular springs">
              {fallbackSprings.slice(0, 6).map((spring) => (
                <div key={spring.id} role="listitem">
                  <SpringCard spring={spring} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  // Loading states
  if (status === 'asking' || status === 'loading') {
    return (
      <section className="container-brutal py-12" aria-busy="true" aria-live="polite">
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="w-10 h-10 text-forest animate-spin mb-4" aria-hidden="true" />
          <p className="text-bark/70 font-body" role="status">
            {status === 'asking' ? 'Requesting your location...' : 'Finding springs near you...'}
          </p>
        </div>
      </section>
    );
  }

  // Denied state
  if (status === 'denied') {
    return (
      <section className="container-brutal py-8" aria-labelledby="denied-heading">
        <div
          className="bg-sand/50 rounded-xl p-6 border border-forest/10 text-center mb-8"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-8 h-8 text-bark/50 mx-auto mb-3" aria-hidden="true" />
          <h3 id="denied-heading" className="font-display font-semibold text-forest mb-2">
            Location Access Denied
          </h3>
          <p className="text-bark/60 font-body text-sm max-w-md mx-auto">
            You&apos;ve denied location access. Browse springs by city below, or enable location in your browser
            settings to see personalized results.
          </p>
        </div>

        {fallbackSprings.length > 0 && (
          <div>
            <h3 className="font-display text-xl font-bold text-forest mb-4">Popular Springs</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Popular springs">
              {fallbackSprings.slice(0, 6).map((spring) => (
                <div key={spring.id} role="listitem">
                  <SpringCard spring={spring} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <section className="container-brutal py-8" aria-labelledby="error-heading">
        <div
          className="bg-terracotta/10 rounded-xl p-6 border border-terracotta/20 text-center"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-8 h-8 text-terracotta mx-auto mb-3" aria-hidden="true" />
          <h3 id="error-heading" className="font-display font-semibold text-forest mb-2">
            Something Went Wrong
          </h3>
          <p className="text-bark/60 font-body text-sm mb-4">{errorMessage}</p>
          <button
            onClick={requestLocation}
            aria-label="Try getting your location again"
            className="text-forest hover:text-terracotta font-display font-medium transition-colors focus:outline-none focus:underline"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // Success - show results grouped by distance
  const distanceBands = groupByDistance(springs);

  if (distanceBands.length === 0) {
    return (
      <section className="container-brutal py-8" aria-labelledby="no-results-heading" aria-live="polite">
        <div className="bg-sand/50 rounded-xl p-8 border border-forest/10 text-center">
          <h3 id="no-results-heading" className="font-display text-xl font-semibold text-forest mb-2">
            No Springs Found Nearby
          </h3>
          <p className="text-bark/60 font-body mb-4">
            We haven&apos;t mapped any {springTypeLabel} within 100 miles of your location yet.
          </p>
          <p className="text-bark/50 font-body text-sm">Try browsing by city or state below.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container-brutal py-8" aria-labelledby="results-heading" aria-live="polite">
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>

      <h2
        id="results-heading"
        ref={resultsHeadingRef}
        tabIndex={-1}
        className="font-display text-xl font-bold text-forest mb-6 outline-none"
      >
        {springs.length} {springTypeLabel} found near you
      </h2>

      <div className="space-y-10">
        {distanceBands.map((band) => (
          <div key={band.label} role="region" aria-label={`Springs ${band.label.toLowerCase()}`}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-display font-semibold text-forest/80">{band.label}</h3>
              <span className="text-bark/50 font-body text-sm" aria-label={`${band.springs.length} springs`}>
                ({band.springs.length} {band.springs.length === 1 ? 'spring' : 'springs'})
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label={`Springs ${band.label.toLowerCase()}`}>
              {band.springs.map((spring) => (
                <div key={spring.id} role="listitem">
                  <SpringCard
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
                      temp_f: spring.temp_f,
                      access_difficulty: spring.access_difficulty,
                      parking: spring.parking,
                      fee_type: spring.fee_type,
                    }}
                    distance={spring.distance_miles}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
