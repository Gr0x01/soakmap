import { cn } from '@/lib/utils';

export type BadgeVariant = 'hot' | 'warm' | 'cold' | 'resort' | 'primitive' | 'hybrid' | 'default';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  // Temperature badges - natural, earthy colors
  hot: 'bg-terracotta/15 text-terracotta border-terracotta/30',
  warm: 'bg-moss/15 text-moss border-moss/30',
  cold: 'bg-river/15 text-river border-river/30',
  // Experience badges - subtle, organic
  resort: 'bg-forest/10 text-forest border-forest/20',
  primitive: 'bg-sand/40 text-bark border-sand',
  hybrid: 'bg-stone text-bark border-bark/20',
  // Default
  default: 'bg-cream text-bark border-bark/20',
};

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1',
        'font-display text-xs font-medium tracking-wide',
        'rounded-full border',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Convenience components for common badge types
export function HotBadge({ className, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="hot" className={className} {...props}>
      Hot
    </Badge>
  );
}

export function WarmBadge({ className, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="warm" className={className} {...props}>
      Warm
    </Badge>
  );
}

export function ColdBadge({ className, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="cold" className={className} {...props}>
      Cold
    </Badge>
  );
}

export function ResortBadge({ className, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="resort" className={className} {...props}>
      Resort
    </Badge>
  );
}

export function PrimitiveBadge({ className, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="primitive" className={className} {...props}>
      Primitive
    </Badge>
  );
}

export function HybridBadge({ className, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="hybrid" className={className} {...props}>
      Hybrid
    </Badge>
  );
}

// Helper to get the right badge based on spring type
export function SpringTypeBadge({ type }: { type: 'hot' | 'warm' | 'cold' }) {
  switch (type) {
    case 'hot':
      return <HotBadge />;
    case 'warm':
      return <WarmBadge />;
    case 'cold':
      return <ColdBadge />;
  }
}

export function ExperienceTypeBadge({ type }: { type: 'resort' | 'primitive' | 'hybrid' }) {
  switch (type) {
    case 'resort':
      return <ResortBadge />;
    case 'primitive':
      return <PrimitiveBadge />;
    case 'hybrid':
      return <HybridBadge />;
  }
}
