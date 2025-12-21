import Link from 'next/link';
import { Droplets } from 'lucide-react';

// Top states by spring count (hardcoded for performance - these rarely change)
const TOP_STATES = [
  { code: 'CA', name: 'California' },
  { code: 'ID', name: 'Idaho' },
  { code: 'NV', name: 'Nevada' },
  { code: 'OR', name: 'Oregon' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'UT', name: 'Utah' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'MT', name: 'Montana' },
  { code: 'WA', name: 'Washington' },
  { code: 'CO', name: 'Colorado' },
];

export function Footer() {
  return (
    <footer className="bg-forest text-cream mt-auto">
      <div className="container-brutal py-12 md:py-16">
        <div className="grid gap-10 md:gap-8 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-cream rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-forest" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight">
                Soak<span className="text-terracotta">Map</span>
              </span>
            </Link>
            <p className="text-cream/70 max-w-sm font-body leading-relaxed text-sm">
              Discover natural hot springs and swimming holes across America.
              Find your perfect soak by temperature, experience type, and location.
            </p>
          </div>

          {/* Browse By Type */}
          <div className="md:col-span-2">
            <h4 className="font-display font-semibold tracking-wide mb-4 text-cream/90 text-sm uppercase">
              By Type
            </h4>
            <ul className="space-y-2.5 font-body text-sm">
              <li>
                <Link
                  href="/type/hot-springs"
                  className="text-cream/60 hover:text-terracotta transition-colors"
                >
                  Hot Springs
                </Link>
              </li>
              <li>
                <Link
                  href="/type/swimming-holes"
                  className="text-cream/60 hover:text-river transition-colors"
                >
                  Swimming Holes
                </Link>
              </li>
              <li>
                <Link
                  href="/type/warm-springs"
                  className="text-cream/60 hover:text-moss transition-colors"
                >
                  Warm Springs
                </Link>
              </li>
              <li>
                <Link
                  href="/states"
                  className="text-cream/60 hover:text-cream transition-colors"
                >
                  Browse by State
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Filters */}
          <div className="md:col-span-2">
            <h4 className="font-display font-semibold tracking-wide mb-4 text-cream/90 text-sm uppercase">
              Filters
            </h4>
            <ul className="space-y-2.5 font-body text-sm">
              <li>
                <Link
                  href="/tag/free"
                  className="text-cream/60 hover:text-cream transition-colors"
                >
                  Free Springs
                </Link>
              </li>
              <li>
                <Link
                  href="/tag/primitive"
                  className="text-cream/60 hover:text-cream transition-colors"
                >
                  Primitive
                </Link>
              </li>
              <li>
                <Link
                  href="/tag/resort"
                  className="text-cream/60 hover:text-cream transition-colors"
                >
                  Resort
                </Link>
              </li>
              <li>
                <Link
                  href="/tag/drive-up"
                  className="text-cream/60 hover:text-cream transition-colors"
                >
                  Drive-Up Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Top States */}
          <div className="md:col-span-4">
            <h4 className="font-display font-semibold tracking-wide mb-4 text-cream/90 text-sm uppercase">
              Top States
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 font-body text-sm">
              {TOP_STATES.map((state) => (
                <Link
                  key={state.code}
                  href={`/${state.code.toLowerCase()}`}
                  className="text-cream/60 hover:text-cream transition-colors"
                >
                  {state.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream/40 text-sm font-body">
            &copy; {new Date().getFullYear()} SoakMap. Find your perfect soak.
          </p>
          <Link
            href="/states"
            className="text-cream/40 hover:text-cream transition-colors text-sm font-body"
          >
            All States
          </Link>
        </div>
      </div>
    </footer>
  );
}
