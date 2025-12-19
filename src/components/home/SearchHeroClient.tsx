'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
    router.push(`/states/${state.code.toLowerCase()}`);
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
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background blobs - soft, organic */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="blob blob-hot blob-animated"
          style={{
            width: '35vw',
            height: '35vw',
            maxWidth: '450px',
            maxHeight: '450px',
            top: '-10%',
            right: '5%',
            opacity: 0.3,
          }}
        />
        <div
          className="blob blob-cold blob-animated"
          style={{
            width: '30vw',
            height: '30vw',
            maxWidth: '350px',
            maxHeight: '350px',
            bottom: '5%',
            left: '-5%',
            animationDelay: '-8s',
            opacity: 0.25,
          }}
        />
      </div>

      {/* Two-column content */}
      <div className="relative z-10 container-brutal">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left column: Text + Stats */}
          <div>
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-forest mb-6 leading-tight">
              Find your
              <br />
              <span className="text-terracotta">perfect soak</span>
            </h1>

            {/* Tagline */}
            <p className="text-lg md:text-xl text-bark/70 mb-10 font-body max-w-lg leading-relaxed">
              Discover natural springs across America —{' '}
              <span className="text-terracotta font-medium">hot springs</span> for winter warmth,{' '}
              <span className="text-river font-medium">swimming holes</span> for summer escapes.
            </p>

            {/* Stats row */}
            <div className="flex gap-10 md:gap-14">
              <div>
                <div className="font-display text-4xl md:text-5xl font-bold text-terracotta">
                  {stats.springs.toLocaleString()}
                </div>
                <div className="text-sm text-bark/50 mt-1 font-body">Springs</div>
              </div>
              <div>
                <div className="font-display text-4xl md:text-5xl font-bold text-river">
                  {stats.states}
                </div>
                <div className="text-sm text-bark/50 mt-1 font-body">States</div>
              </div>
              <div>
                <div className="font-display text-4xl md:text-5xl font-bold text-moss">3</div>
                <div className="text-sm text-bark/50 mt-1 font-body">Types</div>
              </div>
            </div>
          </div>

          {/* Right column: Search */}
          <div className="bg-cream rounded-2xl shadow-medium p-6 md:p-8 border border-forest/5">
            <h2 className="font-display font-semibold text-lg text-forest mb-6">Start exploring</h2>

            <div className="space-y-4">
              {/* State Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    'w-full h-14 pl-12 pr-12 bg-stone rounded-xl font-display font-medium text-left',
                    'flex items-center justify-between cursor-pointer',
                    'border border-forest/10 transition-all duration-300',
                    isOpen ? 'shadow-medium border-forest/20' : 'hover:border-forest/20'
                  )}
                  aria-expanded={isOpen}
                  aria-haspopup="listbox"
                >
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-forest/40" />
                  <span className={selectedState ? 'text-forest' : 'text-bark/50'}>
                    {selectedState ? selectedState.name : 'Choose a state...'}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-forest/40 transition-transform duration-300',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* Dropdown menu */}
                {isOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 bg-cream rounded-xl shadow-lifted border border-forest/10 max-h-64 overflow-y-auto z-50"
                    role="listbox"
                  >
                    {states.map((state) => (
                      <button
                        key={state.code}
                        type="button"
                        onClick={() => handleStateSelect(state)}
                        className={cn(
                          'w-full px-4 py-3 text-left font-display font-medium flex items-center justify-between',
                          'hover:bg-moss/10 transition-colors',
                          'border-b border-forest/5 last:border-b-0',
                          selectedState?.code === state.code && 'bg-forest text-cream hover:bg-forest'
                        )}
                        role="option"
                        aria-selected={selectedState?.code === state.code}
                      >
                        <span>{state.name}</span>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-sm',
                              selectedState?.code === state.code ? 'text-cream/70' : 'text-bark/40'
                            )}
                          >
                            {state.count}
                          </span>
                          {selectedState?.code === state.code && <Check className="w-4 h-4" />}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-forest/10" />
                <span className="text-sm font-body text-bark/40">or</span>
                <div className="flex-1 h-px bg-forest/10" />
              </div>

              {/* Near Me button */}
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full h-14"
                onClick={handleNearMe}
                disabled={isLocating}
              >
                <Navigation className={`w-5 h-5 mr-2 ${isLocating ? 'animate-pulse' : ''}`} />
                {isLocating ? 'Finding your location...' : 'Find springs near me'}
              </Button>
            </div>

            {/* Quick filter chips */}
            <div className="mt-6 pt-6 border-t border-forest/10">
              <p className="text-sm font-body text-bark/50 mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.push('/springs?spring_type=hot')}
                  className="px-4 py-2 bg-terracotta/10 text-terracotta font-display text-sm font-medium rounded-full border border-terracotta/20 hover:bg-terracotta/20 transition-all"
                >
                  Hot Springs
                </button>
                <button
                  onClick={() => router.push('/springs?spring_type=cold')}
                  className="px-4 py-2 bg-river/10 text-river font-display text-sm font-medium rounded-full border border-river/20 hover:bg-river/20 transition-all"
                >
                  Swimming Holes
                </button>
                <button
                  onClick={() => router.push('/springs?experience_type=primitive')}
                  className="px-4 py-2 bg-sand/40 text-bark font-display text-sm font-medium rounded-full border border-sand hover:bg-sand/60 transition-all"
                >
                  Primitive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
