/**
 * Utility functions for pipeline scripts
 */

/**
 * Create URL-safe slug from name
 */
export function slugify(name: string, state: string): string {
  const base = name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${base}-${state.toLowerCase()}`;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chunk array into batches
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Retry with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Determine spring type from temperature
 */
export function getSpringTypeFromTemp(tempF: number | null): 'hot' | 'warm' | 'cold' {
  if (tempF === null) return 'warm'; // default
  if (tempF >= 100) return 'hot';
  if (tempF >= 70) return 'warm';
  return 'cold';
}

/**
 * Parse temperature from text
 * Returns Fahrenheit, converts from Celsius if needed
 */
export function parseTemperature(text: string): number | null {
  // Match patterns like "105°F", "105 F", "40°C", "40 C"
  const fMatch = text.match(/(\d+(?:\.\d+)?)\s*°?\s*[Ff]/);
  if (fMatch) {
    return Math.round(parseFloat(fMatch[1]));
  }

  const cMatch = text.match(/(\d+(?:\.\d+)?)\s*°?\s*[Cc]/);
  if (cMatch) {
    const celsius = parseFloat(cMatch[1]);
    return Math.round((celsius * 9/5) + 32);
  }

  return null;
}

/**
 * Clean and normalize text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

/**
 * State name to code mapping
 */
export const STATE_CODES: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
};

export function stateNameToCode(name: string): string | null {
  const normalized = name.toLowerCase().trim();
  return STATE_CODES[normalized] || null;
}
