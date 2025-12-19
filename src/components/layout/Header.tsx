import Link from 'next/link';
import { Droplets } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-stone/80 backdrop-blur-md border-b border-forest/10">
      <div className="container-brutal">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-forest rounded-lg flex items-center justify-center group-hover:bg-terracotta transition-colors duration-300">
              <Droplets className="w-5 h-5 text-cream" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-forest">
              Soak<span className="text-terracotta">Map</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/springs"
              className="font-display text-sm font-medium text-bark/70 hover:text-forest transition-colors"
            >
              All Springs
            </Link>
            <Link
              href="/states"
              className="font-display text-sm font-medium text-bark/70 hover:text-forest transition-colors"
            >
              By State
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden w-10 h-10 rounded-lg border border-forest/10 bg-cream flex flex-col items-center justify-center gap-1.5 hover:border-forest/30 transition-colors group"
            aria-label="Menu"
          >
            <span className="w-5 h-0.5 bg-forest rounded-full transition-all" />
            <span className="w-5 h-0.5 bg-forest rounded-full transition-all" />
            <span className="w-5 h-0.5 bg-forest rounded-full transition-all" />
          </button>
        </div>
      </div>
    </header>
  );
}
