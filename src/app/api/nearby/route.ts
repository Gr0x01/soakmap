import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import type { SpringType } from '@/types/spring';

// =============================================================================
// Constants
// =============================================================================

const VALID_SPRING_TYPES: readonly SpringType[] = ['hot', 'warm', 'cold'];
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const DEFAULT_RADIUS = 100;
const MAX_RADIUS = 100;

// =============================================================================
// Validation Helpers
// =============================================================================

function parseCoordinate(value: string | null, min: number, max: number): number | null {
  if (!value) return null;
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function parsePositiveInt(value: string | null, defaultVal: number, max: number): number {
  if (!value) return defaultVal;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1) return defaultVal;
  return Math.min(parsed, max);
}

function isValidSpringType(value: string | null): value is SpringType {
  return value !== null && VALID_SPRING_TYPES.includes(value as SpringType);
}

// =============================================================================
// API Route
// =============================================================================

/**
 * GET /api/nearby - Find springs near a location
 *
 * Query params:
 * - lat (required): Latitude (-90 to 90)
 * - lng (required): Longitude (-180 to 180)
 * - type (optional): Filter by spring_type ('hot' | 'warm' | 'cold')
 * - limit (optional): Max results (1-50, default 20)
 * - radius (optional): Search radius in miles (1-100, default 100)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse and validate coordinates
  const lat = parseCoordinate(searchParams.get('lat'), -90, 90);
  const lng = parseCoordinate(searchParams.get('lng'), -180, 180);

  if (lat === null || lng === null) {
    return NextResponse.json(
      { error: 'Missing or invalid coordinates. lat must be -90 to 90, lng must be -180 to 180.' },
      { status: 400 }
    );
  }

  // Parse and validate optional type parameter
  const typeParam = searchParams.get('type');
  if (typeParam !== null && !isValidSpringType(typeParam)) {
    return NextResponse.json(
      { error: `Invalid type parameter. Must be one of: ${VALID_SPRING_TYPES.join(', ')}` },
      { status: 400 }
    );
  }
  const springType: SpringType | null = typeParam;

  // Parse optional numeric params with validation
  const limit = parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);
  const radius = parsePositiveInt(searchParams.get('radius'), DEFAULT_RADIUS, MAX_RADIUS);

  // Fetch nearby springs from database
  const result = await db.getNearby(lat, lng, radius, MAX_LIMIT);

  if (!result.ok) {
    console.error('API /nearby error:', result.error);
    return NextResponse.json({ error: 'Failed to fetch nearby springs' }, { status: 500 });
  }

  // Filter by type if specified
  let springs = result.data;
  if (springType) {
    springs = springs.filter((s) => s.spring_type === springType);
  }

  // Apply limit after filtering
  springs = springs.slice(0, limit);

  return NextResponse.json({
    springs,
    count: springs.length,
    location: { lat, lng },
  });
}
