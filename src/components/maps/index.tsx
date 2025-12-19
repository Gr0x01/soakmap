'use client';

import dynamic from 'next/dynamic';
import { Component, ReactNode } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import type { SpringType, ExperienceType } from '@/types/spring';

// Loading placeholder
function MapLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full min-h-[200px] bg-cream rounded-xl border border-forest/10 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <MapPin className="w-8 h-8 mx-auto text-forest/30 mb-2 animate-pulse" />
        <p className="text-sm text-bark/50 font-body">Loading map...</p>
      </div>
    </div>
  );
}

// Error fallback
function MapError({ className = '', onRetry }: { className?: string; onRetry?: () => void }) {
  return (
    <div className={`w-full h-full min-h-[200px] bg-cream rounded-xl border border-terracotta/20 flex items-center justify-center ${className}`}>
      <div className="text-center p-4">
        <AlertCircle className="w-8 h-8 mx-auto text-terracotta/60 mb-2" />
        <p className="text-sm text-bark/70 font-body mb-3">Unable to load map</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-forest hover:text-terracotta transition-colors font-display font-medium"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// Error boundary component for maps
interface MapErrorBoundaryProps {
  children: ReactNode;
  className?: string;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return <MapError className={this.props.className} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Dynamic imports with SSR disabled
const SpringMapInner = dynamic(
  () => import('./SpringMap').then((mod) => mod.SpringMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
);

const SingleSpringMapInner = dynamic(
  () => import('./SpringMap').then((mod) => mod.SingleSpringMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
);

// Wrapped components with error boundaries
export function SpringMap(props: {
  springs: SpringMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMarkerClick?: (slug: string) => void;
}) {
  return (
    <MapErrorBoundary className={props.className}>
      <SpringMapInner {...props} />
    </MapErrorBoundary>
  );
}

export function SingleSpringMap(props: {
  lat: number;
  lng: number;
  name: string;
  springType: SpringType;
  className?: string;
}) {
  return (
    <MapErrorBoundary className={props.className}>
      <SingleSpringMapInner {...props} />
    </MapErrorBoundary>
  );
}

// Re-export types for convenience
export type SpringMarker = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  spring_type: SpringType;
  experience_type: ExperienceType;
};
