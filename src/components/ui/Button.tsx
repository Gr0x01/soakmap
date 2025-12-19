'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'hot' | 'cold' | 'warm' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles - natural, organic feel
          'inline-flex items-center justify-center font-display font-semibold tracking-wide',
          'rounded-lg shadow-soft',
          'hover-lift hover-press focus-natural',
          'disabled:opacity-50 disabled:pointer-events-none',
          'transition-all duration-300',
          // Variants
          {
            // Primary - deep forest green
            'bg-forest text-cream hover:bg-forest/90': variant === 'primary',
            // Secondary - cream with forest border
            'bg-cream text-forest border border-forest/20 hover:border-forest/40': variant === 'secondary',
            // Hot - terracotta
            'bg-terracotta text-cream hover:bg-terracotta/90': variant === 'hot',
            // Cold - river teal
            'bg-river text-cream hover:bg-river/90': variant === 'cold',
            // Warm - moss sage
            'bg-moss text-cream hover:bg-moss/90': variant === 'warm',
            // Ghost - transparent with forest text
            'bg-transparent text-forest hover:bg-forest/5 border border-transparent hover:border-forest/20':
              variant === 'ghost',
          },
          // Sizes
          {
            'px-3 py-1.5 text-xs rounded-md': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-8 py-4 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
