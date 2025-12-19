import type { Spring } from '@/types/spring';

const BASE_URL = 'https://soakmap.com';

/**
 * Sanitize a string for use in JSON-LD schema
 * Removes control characters and limits length
 */
function sanitizeSchemaString(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim()
    .slice(0, 500);                  // Reasonable length limit
}

/**
 * Validate slug format (alphanumeric with hyphens)
 */
function validateSlug(slug: string): string {
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    throw new Error(`Invalid slug format: ${slug}`);
  }
  return slug.toLowerCase();
}

/**
 * Validate image URL (only allow http/https)
 */
function validateImageUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return undefined;
    }
    return url;
  } catch {
    return undefined;
  }
}

/**
 * Safely stringify JSON for JSON-LD, escaping HTML special chars
 * Prevents XSS when embedding in script tags
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Generate TouristAttraction schema for a spring
 * https://schema.org/TouristAttraction
 */
export function generateSpringSchema(spring: Spring) {
  // Validate required fields
  if (!spring.name || !spring.slug || !spring.lat || !spring.lng) {
    throw new Error('Missing required spring fields for schema generation');
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: sanitizeSchemaString(spring.name),
    description: sanitizeSchemaString(spring.description),
    url: `${BASE_URL}/springs/${validateSlug(spring.slug)}`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: spring.lat,
      longitude: spring.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressRegion: spring.state,
      addressCountry: 'US',
    },
    touristType: getTouristType(spring.experience_type),
  };

  // Add image if available and valid
  const validatedImage = validateImageUrl(spring.photo_url);
  if (validatedImage) {
    schema.image = validatedImage;
  }

  // Add fee information
  if (spring.fee_type === 'free') {
    schema.isAccessibleForFree = true;
  } else if (spring.fee_type === 'paid' && spring.fee_amount_usd) {
    schema.isAccessibleForFree = false;
    schema.offers = {
      '@type': 'Offer',
      price: spring.fee_amount_usd,
      priceCurrency: 'USD',
    };
  }

  return schema;
}

/**
 * Map experience type to tourist type
 */
function getTouristType(experienceType: string): string {
  switch (experienceType) {
    case 'resort':
      return 'Wellness tourism';
    case 'primitive':
      return 'Adventure tourism';
    case 'hybrid':
      return 'Nature tourism';
    default:
      return 'Nature tourism';
  }
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
