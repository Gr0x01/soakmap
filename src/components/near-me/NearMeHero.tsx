import { Flame, Droplets, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NearMePageType } from '@/lib/data/near-me-content';

interface NearMeHeroProps {
  pageType: NearMePageType;
  title: string;
  intro: string;
  springCount: number;
}

export function NearMeHero({ pageType, title, intro, springCount }: NearMeHeroProps) {
  const iconColors = {
    'hot-springs': 'text-terracotta',
    'swimming-holes': 'text-river',
    'natural-springs': 'text-forest',
  };

  const bgGradients = {
    'hot-springs': 'from-terracotta/5 via-transparent to-sand/20',
    'swimming-holes': 'from-river/5 via-transparent to-sand/20',
    'natural-springs': 'from-forest/5 via-transparent to-sand/20',
  };

  const accentBlur = {
    'hot-springs': 'bg-terracotta/10',
    'swimming-holes': 'bg-river/10',
    'natural-springs': 'bg-moss/10',
  };

  const Icon = pageType === 'hot-springs' ? Flame : pageType === 'swimming-holes' ? Droplets : Compass;

  return (
    <div className="container-brutal mb-12">
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl p-8 md:p-12 border border-forest/10',
          `bg-gradient-to-br ${bgGradients[pageType]}`
        )}
      >
        {/* Decorative blurs */}
        <div className={cn('absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl', accentBlur[pageType])} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-sand/20 blur-3xl" />

        <div className="relative">
          {/* Icon + label */}
          <div className="flex items-center gap-2 text-bark/60 font-body text-sm mb-3">
            <Icon className={cn('w-4 h-4', iconColors[pageType])} />
            <span>{springCount.toLocaleString()} springs in our database</span>
          </div>

          {/* H1 */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest mb-4 leading-tight">
            {title}
          </h1>

          {/* Intro paragraph */}
          <p className="text-lg text-bark/70 font-body max-w-3xl leading-relaxed">{intro}</p>
        </div>
      </div>
    </div>
  );
}
