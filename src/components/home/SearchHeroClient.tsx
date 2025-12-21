'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Navigation, ChevronDown, Check, Flame, Waves, Droplet, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchHeroClientProps {
  stats: {
    springs: number;
    states: number;
    hot: number;
    warm: number;
    cold: number;
  };
  states: Array<{ code: string; name: string; count: number }>;
}

export function SearchHeroClient({ stats, states }: SearchHeroClientProps) {
  const router = useRouter();
  const [selectedState, setSelectedState] = useState<{ code: string; name: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleStateSelect = (state: { code: string; name: string }) => {
    setSelectedState(state);
    setIsOpen(false);
    router.push(`/${state.code.toLowerCase()}`);
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(`/near?lat=${latitude}&lng=${longitude}`);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please select a state instead.');
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <>
      {/* ================================================================
          HERO SECTION - Bold typography, dark forest background
          ================================================================ */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-forest">
        {/* Layered background effects */}
        <div className="absolute inset-0">
          {/* Gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-bark via-forest to-forest" />

          {/* Topographic contour pattern - external SVG */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'url(/patterns/contour-map.svg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'invert(1)',
            }}
            aria-hidden="true"
          />

          {/* Organic color blobs */}
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
            style={{ background: 'linear-gradient(135deg, var(--color-terracotta), var(--color-sand))' }}
          />
          <div
            className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full blur-[140px] opacity-15"
            style={{ background: 'linear-gradient(135deg, var(--color-river), var(--color-moss))' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 container-brutal py-16 md:py-24">
          {/* Eyebrow stat */}
          <p
            className="font-display text-moss text-sm md:text-base tracking-widest uppercase mb-6 md:mb-8"
            style={{ animationDelay: '0.1s' }}
          >
            {stats.springs.toLocaleString()} springs · {stats.states} states
          </p>

          {/* Main headline - MASSIVE typography */}
          <h1 className="mb-8 md:mb-12">
            <span className="block font-display text-[clamp(3.5rem,12vw,9rem)] font-extrabold leading-[0.9] tracking-tight text-cream">
              Find your
            </span>
            <span className="block font-display text-[clamp(3.5rem,12vw,9rem)] font-extrabold leading-[0.9] tracking-tight text-terracotta">
              perfect soak
            </span>
          </h1>

          {/* Subheadline */}
          <p className="font-body text-cream/60 text-lg md:text-xl max-w-2xl leading-relaxed mb-12 md:mb-16">
            From steaming hot springs for winter warmth to refreshing swimming holes
            for summer escapes. Discover natural waters across America.
          </p>

          {/* Action row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-20 md:mb-28">
            {/* Near me button - Primary CTA */}
            <button
              type="button"
              onClick={handleNearMe}
              disabled={isLocating}
              className={cn(
                'group flex items-center justify-center gap-3 px-8 py-4',
                'bg-terracotta hover:bg-terracotta/90 text-cream',
                'font-display font-semibold text-base',
                'rounded-full transition-all duration-300',
                'hover:shadow-lg hover:shadow-terracotta/25',
                'disabled:opacity-70 disabled:cursor-not-allowed'
              )}
            >
              <Navigation className={cn('w-5 h-5', isLocating && 'animate-pulse')} />
              {isLocating ? 'Finding location...' : 'Find springs near me'}
            </button>

            {/* State dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  'flex items-center justify-between gap-3 w-full sm:w-64 px-6 py-4',
                  'bg-cream/10 hover:bg-cream/15 backdrop-blur-sm',
                  'border border-cream/20 hover:border-cream/30',
                  'font-display font-medium text-cream text-base',
                  'rounded-full transition-all duration-300',
                  isOpen && 'border-cream/40 bg-cream/15'
                )}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cream/50" />
                  <span className={selectedState ? 'text-cream' : 'text-cream/60'}>
                    {selectedState ? selectedState.name : 'Browse by state'}
                  </span>
                </span>
                <ChevronDown className={cn(
                  'w-4 h-4 text-cream/50 transition-transform duration-300',
                  isOpen && 'rotate-180'
                )} />
              </button>

              {/* Dropdown */}
              {isOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 bg-cream rounded-2xl shadow-lifted border border-forest/10 max-h-72 overflow-y-auto z-50"
                  role="listbox"
                >
                  {states.map((state) => (
                    <button
                      key={state.code}
                      type="button"
                      onClick={() => handleStateSelect(state)}
                      className={cn(
                        'w-full px-5 py-3 text-left font-display font-medium flex items-center justify-between',
                        'hover:bg-forest/5 transition-colors',
                        'border-b border-forest/5 last:border-b-0',
                        selectedState?.code === state.code && 'bg-forest text-cream hover:bg-forest'
                      )}
                      role="option"
                      aria-selected={selectedState?.code === state.code}
                    >
                      <span className={selectedState?.code === state.code ? 'text-cream' : 'text-forest'}>
                        {state.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm',
                          selectedState?.code === state.code ? 'text-cream/70' : 'text-bark/40'
                        )}>
                          {state.count}
                        </span>
                        {selectedState?.code === state.code && <Check className="w-4 h-4" />}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Temperature type cards - The "vibe" selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Hot Springs */}
            <Link
              href="/springs?spring_type=hot"
              className="group relative overflow-hidden rounded-2xl p-6 md:p-8 bg-bark/80 backdrop-blur-md border-2 border-terracotta/30 hover:border-terracotta/60 transition-all duration-300 hover:scale-[1.02] shadow-lg"
            >
              {/* Accent glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-terracotta via-terracotta/80 to-transparent" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-terracotta/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-terracotta/20 border border-terracotta/40 flex items-center justify-center">
                    <Flame className="w-7 h-7 text-terracotta" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-cream group-hover:text-terracotta transition-colors">
                      Hot Springs
                    </h3>
                    <p className="text-cream/70 text-sm font-body">{stats.hot.toLocaleString()} locations</p>
                  </div>
                </div>
                <p className="text-cream/80 font-body text-sm leading-relaxed mb-4">
                  100°F+ mineral pools. Winter soaking, therapeutic relaxation.
                </p>
                <span className="inline-flex items-center gap-2 text-terracotta font-display font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* Warm Springs */}
            <Link
              href="/springs?spring_type=warm"
              className="group relative overflow-hidden rounded-2xl p-6 md:p-8 bg-bark/80 backdrop-blur-md border-2 border-moss/30 hover:border-moss/60 transition-all duration-300 hover:scale-[1.02] shadow-lg"
            >
              {/* Accent glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-moss via-moss/80 to-transparent" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-moss/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-moss/20 border border-moss/40 flex items-center justify-center">
                    <Waves className="w-7 h-7 text-moss" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-cream group-hover:text-moss transition-colors">
                      Warm Springs
                    </h3>
                    <p className="text-cream/70 text-sm font-body">{stats.warm.toLocaleString()} locations</p>
                  </div>
                </div>
                <p className="text-cream/80 font-body text-sm leading-relaxed mb-4">
                  70-99°F gentle waters. Year-round comfort, perfect balance.
                </p>
                <span className="inline-flex items-center gap-2 text-moss font-display font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* Swimming Holes */}
            <Link
              href="/springs?spring_type=cold"
              className="group relative overflow-hidden rounded-2xl p-6 md:p-8 bg-bark/80 backdrop-blur-md border-2 border-river/30 hover:border-river/60 transition-all duration-300 hover:scale-[1.02] shadow-lg"
            >
              {/* Accent glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-river via-river/80 to-transparent" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-river/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-river/20 border border-river/40 flex items-center justify-center">
                    <Droplet className="w-7 h-7 text-river" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-cream group-hover:text-river transition-colors">
                      Swimming Holes
                    </h3>
                    <p className="text-cream/70 text-sm font-body">{stats.cold.toLocaleString()} locations</p>
                  </div>
                </div>
                <p className="text-cream/80 font-body text-sm leading-relaxed mb-4">
                  Under 70°F crystal waters. Summer escapes, cliff jumps, rope swings.
                </p>
                <span className="inline-flex items-center gap-2 text-river font-display font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
