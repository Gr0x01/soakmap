'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { SpringType, ExperienceType } from '@/types/spring';

interface SpringMarker {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  spring_type: SpringType;
  experience_type: ExperienceType;
}

interface SpringMapProps {
  springs: SpringMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Color mapping for spring types
const MARKER_COLORS: Record<SpringType, string> = {
  hot: '#C65D3B',    // terracotta
  warm: '#8B9E6B',   // moss
  cold: '#4A7C8C',   // river
};

// Type labels for display
const TYPE_LABELS: Record<SpringType, string> = {
  hot: 'Hot Spring',
  warm: 'Warm Spring',
  cold: 'Swimming Hole',
};

// Experience icons (simple SVG paths)
const EXPERIENCE_ICONS: Record<ExperienceType, string> = {
  resort: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M13 21V3l6 4v14"/></svg>`,
  primitive: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h20L12 2z"/><path d="M12 16v2"/></svg>`,
  hybrid: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
};

// Validate slug format to prevent open redirects
const SLUG_PATTERN = /^[a-z0-9-]+$/;

function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && slug.length > 0 && slug.length < 200;
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Format spring type for display
function formatType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function SpringMap({
  springs,
  center,
  zoom = 6,
  className = '',
}: SpringMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const cleanupFns = useRef<(() => void)[]>([]);

  // Calculate center from springs if not provided
  const getCenter = useCallback((): [number, number] => {
    if (center) return center;
    if (springs.length === 0) return [-98.5, 39.8]; // US center
    const avgLat = springs.reduce((sum, s) => sum + s.lat, 0) / springs.length;
    const avgLng = springs.reduce((sum, s) => sum + s.lng, 0) / springs.length;
    return [avgLng, avgLat];
  }, [center, springs]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter = getCenter();

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: initialCenter,
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      // Run all cleanup functions
      cleanupFns.current.forEach((fn) => fn());
      cleanupFns.current = [];
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only initialize map once on mount

  // Update markers when springs change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers and cleanup
    cleanupFns.current.forEach((fn) => fn());
    cleanupFns.current = [];
    markers.current.forEach((m) => m.remove());
    markers.current = [];

    // Add new markers
    springs.forEach((spring) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'spring-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = MARKER_COLORS[spring.spring_type];
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'box-shadow 0.15s ease';

      // Accessibility attributes
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `View ${escapeHtml(spring.name)} - ${formatType(spring.spring_type)} spring`);

      // Event handlers - use box-shadow for hover effect instead of transform
      // to avoid position issues with MapLibre markers
      const handleMouseEnter = () => {
        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';
      };
      const handleMouseLeave = () => {
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      };

      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);

      // Store cleanup function
      cleanupFns.current.push(() => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });

      // Create popup with escaped content
      const escapedName = escapeHtml(spring.name);
      const typeLabel = TYPE_LABELS[spring.spring_type];
      const experienceLabel = formatType(spring.experience_type);
      const experienceIcon = EXPERIENCE_ICONS[spring.experience_type];
      const markerColor = MARKER_COLORS[spring.spring_type];
      const springUrl = isValidSlug(spring.slug) ? `/springs/${spring.slug}` : '#';

      const popup = new maplibregl.Popup({
        offset: 18,
        closeButton: false,
        closeOnClick: true,
        className: 'spring-popup',
        maxWidth: '280px',
      }).setHTML(`
        <div class="spring-popup-content">
          <div class="spring-popup-header">
            <span class="spring-popup-badge" style="background: ${markerColor};">${typeLabel}</span>
          </div>
          <h3 class="spring-popup-name">${escapedName}</h3>
          <div class="spring-popup-meta">
            <span class="spring-popup-experience">${experienceIcon} ${experienceLabel}</span>
          </div>
          <a href="${springUrl}" class="spring-popup-link">
            View Details
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([spring.lng, spring.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit bounds if multiple springs
    if (springs.length > 1 && map.current) {
      const bounds = new maplibregl.LngLatBounds();
      springs.forEach((spring) => {
        bounds.extend([spring.lng, spring.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  }, [springs]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full min-h-[300px] rounded-xl overflow-hidden ${className}`}
      role="application"
      aria-label="Map showing spring locations"
    />
  );
}

// Single spring map for detail pages
interface SingleSpringMapProps {
  lat: number;
  lng: number;
  name: string;
  springType: SpringType;
  className?: string;
}

export function SingleSpringMap({
  lat,
  lng,
  name,
  springType,
  className = '',
}: SingleSpringMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [lng, lat],
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Create marker element with accessibility
    const el = document.createElement('div');
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = MARKER_COLORS[springType];
    el.style.border = '4px solid white';
    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', `${escapeHtml(name)} location marker`);

    // Escape content for popup
    const escapedName = escapeHtml(name);
    const coordsText = `${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W`;

    // Add marker with popup
    new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(
        new maplibregl.Popup({ offset: 20 }).setHTML(`
          <div style="font-family: system-ui, sans-serif; padding: 4px;">
            <strong style="font-size: 14px; color: #2D4739;">${escapedName}</strong>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              ${coordsText}
            </div>
          </div>
        `)
      )
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [lat, lng, name, springType]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full min-h-[200px] rounded-xl overflow-hidden ${className}`}
      role="application"
      aria-label={`Map showing location of ${name}`}
    />
  );
}
