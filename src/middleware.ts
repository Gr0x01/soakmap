import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter
// Note: Resets on deploy and is per-instance (not distributed across Edge regions)
// For MVP this is acceptable - upgrade to Vercel KV if abuse becomes a real problem
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

// Rate limit config
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_USERS = 60; // 60 req/min for browsers (generous for humans)
const MAX_REQUESTS_BOTS = 30; // 30 req/min for unknown bots
const MAX_REQUESTS_AGGRESSIVE = 10; // 10 req/min for SEO tool bots
const MAX_REQUESTS_GOOD_BOTS = 120; // 120 req/min for search engines (2/sec)

// SEO tool bots - rate limit strictly
const AGGRESSIVE_BOT_PATTERNS = [
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /bytespider/i,
  /petalbot/i,
  /dataforseo/i,
  /blexbot/i,
  /seekport/i,
  /serpstat/i,
];

// Search engine bots - allow generously but not unlimited
const GOOD_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /duckduckbot/i,
  /slurp/i, // Yahoo
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
];

// Browser patterns for likely-human traffic
const BROWSER_PATTERNS = [
  /mozilla/i,
  /chrome/i,
  /safari/i,
  /firefox/i,
  /edge/i,
  /opera/i,
];

function getRateLimitKey(request: NextRequest, userAgent: string): string {
  // Use bot name if detectable, otherwise IP
  for (const pattern of [...AGGRESSIVE_BOT_PATTERNS, ...GOOD_BOT_PATTERNS]) {
    const match = userAgent.match(pattern);
    if (match) {
      return `bot:${match[0].toLowerCase()}`;
    }
  }
  // Fall back to IP for unknown user agents
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  return `ip:${ip}`;
}

function isRateLimited(key: string, maxRequests: number): boolean {
  const now = Date.now();

  // Lazy cleanup: remove stale entries (Edge Runtime doesn't support setInterval)
  // Only clean up a few entries per request to avoid performance impact
  let cleanupCount = 0;
  for (const [k, record] of rateLimitMap.entries()) {
    if (now - record.windowStart > WINDOW_MS * 2) {
      rateLimitMap.delete(k);
      cleanupCount++;
      if (cleanupCount >= 10) break; // Limit cleanup per request
    }
  }

  const record = rateLimitMap.get(key);

  if (!record || now - record.windowStart > WINDOW_MS) {
    // New window
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const key = getRateLimitKey(request, userAgent);

  // Determine traffic type
  const isAggressiveBot = AGGRESSIVE_BOT_PATTERNS.some((p) => p.test(userAgent));
  const isGoodBot = GOOD_BOT_PATTERNS.some((p) => p.test(userAgent));
  const isBrowser = BROWSER_PATTERNS.some((p) => p.test(userAgent));

  // Good bots (search engines) - generous but not unlimited
  if (isGoodBot) {
    if (isRateLimited(key, MAX_REQUESTS_GOOD_BOTS)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'Content-Type': 'text/plain',
        },
      });
    }
    return NextResponse.next();
  }

  // Aggressive SEO bots - strict rate limit
  if (isAggressiveBot) {
    if (isRateLimited(key, MAX_REQUESTS_AGGRESSIVE)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'Content-Type': 'text/plain',
        },
      });
    }
    return NextResponse.next();
  }

  // Browsers (likely humans) - generous limit
  if (isBrowser) {
    if (isRateLimited(key, MAX_REQUESTS_USERS)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'Content-Type': 'text/plain',
        },
      });
    }
    return NextResponse.next();
  }

  // Unknown bots/agents - moderate limit
  if (isRateLimited(key, MAX_REQUESTS_BOTS)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'Content-Type': 'text/plain',
      },
    });
  }

  return NextResponse.next();
}

// Only run middleware on page routes, not static assets
export const config = {
  matcher: [
    // Match all routes except static files and api
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap|api).*)',
  ],
};
