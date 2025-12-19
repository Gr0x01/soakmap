import Link from 'next/link';
import { Droplets, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-forest text-cream mt-auto">
      <div className="container-brutal py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-cream rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-forest" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight">
                Soak<span className="text-terracotta">Map</span>
              </span>
            </Link>
            <p className="text-cream/70 max-w-md font-body leading-relaxed">
              Discover natural hot springs and swimming holes across America.
              Filter by temperature, experience type, and location to find your
              perfect soak.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold tracking-wide mb-4 text-cream/90">
              Explore
            </h4>
            <ul className="space-y-2 font-body">
              <li>
                <Link
                  href="/springs"
                  className="text-cream/60 hover:text-moss transition-colors"
                >
                  All Springs
                </Link>
              </li>
              <li>
                <Link
                  href="/states"
                  className="text-cream/60 hover:text-moss transition-colors"
                >
                  Browse by State
                </Link>
              </li>
              <li>
                <Link
                  href="/springs?spring_type=hot"
                  className="text-cream/60 hover:text-terracotta transition-colors"
                >
                  Hot Springs
                </Link>
              </li>
              <li>
                <Link
                  href="/springs?spring_type=cold"
                  className="text-cream/60 hover:text-river transition-colors"
                >
                  Swimming Holes
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-display font-semibold tracking-wide mb-4 text-cream/90">
              About
            </h4>
            <ul className="space-y-2 font-body">
              <li>
                <Link
                  href="/about"
                  className="text-cream/60 hover:text-moss transition-colors"
                >
                  About SoakMap
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="text-cream/60 hover:text-moss transition-colors"
                >
                  Submit a Spring
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-cream/60 hover:text-moss transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream/40 text-sm font-body">
            &copy; {new Date().getFullYear()} SoakMap. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream/40 hover:text-cream transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
