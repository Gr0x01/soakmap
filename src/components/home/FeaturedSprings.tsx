import { SpringGrid } from '@/components/springs/SpringCard';
import { getFeaturedSprings } from '@/lib/data/springs';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export async function FeaturedSprings() {
  const springs = await getFeaturedSprings(6);

  return (
    <section className="py-16 md:py-24 bg-cream/50">
      <div className="container-brutal">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-forest">
              Featured Springs
            </h2>
            <p className="text-bark/60 mt-3 max-w-lg font-body leading-relaxed">
              Hand-picked destinations for your next adventure. From steaming hot
              springs to refreshing swimming holes.
            </p>
          </div>
          <Link href="/springs">
            <Button variant="ghost" className="group">
              View all springs
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Springs grid */}
        <SpringGrid springs={springs} />
      </div>
    </section>
  );
}
