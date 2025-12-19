# SoakMap Implementation Plan

**Project:** Natural springs directory to beat findaspring.com and swimmingholes.org
**Timeline:** 4 days
**Approach:** Parallel track (Schema + frontend scaffold on day 1, then data pipeline while iterating UI)
**Reference:** DDD project at `/Users/rb/Documents/coding_projects/ddd` - proven patterns to follow

---

## Day 1: Foundation ✅ COMPLETED

### 1.1 Initialize Next.js Project ✅

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Dependencies installed:**
- `@supabase/supabase-js`, `@supabase/ssr` - Database client
- `zod` - Runtime validation
- `lucide-react` - Icons
- `date-fns` - Date formatting
- `maplibre-gl` - Maps
- `clsx`, `tailwind-merge` - Styling utilities
- `@playwright/test`, `prettier`, `tsx` - Dev tools

### 1.2 Supabase Schema ✅ APPLIED

**Files run in Supabase SQL Editor:**
1. `supabase/schema.sql` - Main schema
2. `supabase/migrations/001_code_review_fixes.sql` - Indexes, RLS, optimizations

**Enums created (12 total):**
- `spring_type`: hot | warm | cold
- `experience_type`: resort | primitive | hybrid
- `access_difficulty`: drive_up | short_walk | moderate_hike | difficult_hike
- `parking_type`: ample | limited | very_limited | roadside | trailhead
- `cell_service_type`: full | partial | none | unknown
- `fee_type`: free | paid | donation | unknown
- `crowd_level`: empty | quiet | moderate | busy | packed
- `best_season`: spring | summer | fall | winter | year_round
- `best_time`: weekday | weekend | early_morning | evening | any
- `clothing_optional_type`: yes | no | unofficial | unknown
- `confidence_level`: high | medium | low
- `warning_type`: (11 values)

**Tables created:**
- `springs` - Main spring data with PostGIS location
- `states` - 50 US states with spring counts

**Indexes created:**
- Single column: state, spring_type, experience_type, slug, confidence
- Composite: state+type, state+experience, photo+confidence (partial)
- Spatial: GIST on location
- Text search: trigram on name (pg_trgm)

**RLS policies:**
- Public read access for springs and states
- Service role write access for admin operations

**Functions & triggers:**
- `nearby_springs()` - PostGIS proximity search
- `update_updated_at()` - Auto-update timestamps
- `update_state_counts()` - Incremental count updates (optimized)

### 1.3 Code Quality Fixes ✅

Applied from code review:
- SQL injection protection (escape LIKE wildcards)
- Environment validation (`src/lib/env.ts`)
- Result type for error handling
- Fresh Supabase client per request (not singleton)
- Pagination limits (max 100 results, max 10000 offset)
- Efficient stats query (aggregate from states table)
- Full Database types (`src/types/database.ts`) with typed RPC

### 1.4 UI Components ✅ IMPLEMENTED

**Design System: "Fluid Brutalism"**
- **Typography:** Syne (display) + Space Grotesk (body)
- **Colors:** Concrete (#e8e4df), Surface (#fff), Ink (#0a0a0a), Hot (#e53935), Cold (#1565c0), Warm (#c6ff00)
- **Shadows:** brutal (8px offset), brutal-sm (4px), brutal-hover (12px)
- **Borders:** 4px solid ink (brutal), 8px thick
- **Effects:** hover-lift, hover-press, blob animations, grain overlay

**Components Created:**

| Component | File | Features |
|-----------|------|----------|
| `Button` | `src/components/ui/Button.tsx` | 6 variants (primary, secondary, hot, cold, warm, ghost), 3 sizes |
| `Badge` | `src/components/ui/Badge.tsx` | Temperature badges, experience badges, helper components |
| `Card` | `src/components/ui/Card.tsx` | Generic wrapper with hover lift |
| `SpringCard` | `src/components/springs/SpringCard.tsx` | Photo/gradient placeholder, badges, hover effects |
| `SpringGrid` | `src/components/springs/SpringCard.tsx` | Responsive 1/2/3 column grid |
| `FilterToggles` | `src/components/home/FilterToggles.tsx` | Type/experience toggles, compact row variant |
| `Header` | `src/components/layout/Header.tsx` | Logo, nav links, mobile menu button |
| `Footer` | `src/components/layout/Footer.tsx` | Links, copyright |
| `SearchHero` | `src/components/home/SearchHero.tsx` | State dropdown, geolocation, quick filters, stats |
| `FeaturedSprings` | `src/components/home/FeaturedSprings.tsx` | 6-card grid with "View All" link |

**Global Styles (`src/app/globals.css`):**
- CSS custom properties for colors, shadows, spacing
- Tailwind @theme integration
- Blob shapes with morph animation
- Container utility (max-width 1400px)
- Selection, scrollbar, grain texture styling

### 1.5 Mock Data ✅ CREATED

**File:** `src/lib/data/mock-springs.ts`

**12 sample springs** covering all types and experiences:

| Name | State | Type | Experience |
|------|-------|------|------------|
| Goldbug Hot Springs | ID | hot | primitive |
| Strawberry Park Hot Springs | CO | hot | hybrid |
| Glenwood Hot Springs | CO | hot | resort |
| Travertine Hot Springs | CA | hot | primitive |
| Terwilliger Hot Springs | OR | hot | primitive |
| Barton Springs Pool | TX | warm | hybrid |
| Blue Hole | NM | warm | primitive |
| Hamilton Pool Preserve | TX | cold | hybrid |
| Sliding Rock | NC | cold | hybrid |
| Havasu Falls | AZ | cold | primitive |
| Jacob's Well | TX | cold | primitive |
| Devil's Bathtub | VA | cold | primitive |

**Data Abstraction Layer:** `src/lib/data/springs.ts`
- Tries Supabase first, falls back to mock data
- Functions: `getSprings()`, `getFeaturedSprings()`, `getSpringBySlug()`, `getSpringCounts()`, `getAllSpringSlugs()`

### 1.6 Folder Structure

```
src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── springs/[slug]/page.tsx
│   ├── states/[state]/page.tsx
│   ├── near/[location]/page.tsx
│   └── api/
│       ├── springs/route.ts
│       ├── states/route.ts
│       └── nearby/route.ts
├── components/
│   ├── ui/ (Button, Badge, Card)
│   ├── layout/ (Header, Footer)
│   ├── springs/ (SpringCard, SpringGrid, StateFilters)
│   ├── maps/ (SpringMap, SingleSpringMap, index.tsx)
│   └── home/ (SearchHero, FilterToggles, FeaturedSprings)
├── lib/
│   ├── supabase/ (client.ts, server.ts)
│   ├── schemas/ (spring.ts)
│   ├── data/ (springs.ts, mock-springs.ts)
│   └── utils/ (cn.ts)
└── types/ (spring.ts, database.ts)

scripts/
├── lib/ (config, supabase, validation, auto-correct, cost-tracker, logger, rate-limiter)
├── data/ (gnis-springs.txt, state-codes.ts, discovery-queries.ts)
├── 01-import-gnis.ts
├── 02-scrape-swimmingholes.ts
├── 03-discover-springs.ts
├── 04-enrich-springs.ts
├── 05-validate-data.ts
└── run-pipeline.ts

tests/e2e/ (home.spec.ts, spring-detail.spec.ts, state-page.spec.ts)
```

---

## Day 2: Core Pages + Components

### 2.1 Design Direction (per frontend-design skill)

**Aesthetic:** Organic/natural with editorial quality
- **Typography:** Space Grotesk (display) + Newsreader (body)
- **Colors:** Earth tones with blue water accents - dominant warm neutrals, sharp aqua/teal for CTAs
- **Layout:** Generous whitespace, subtle asymmetry
- **Details:** Subtle grain texture overlay, soft shadows, rounded corners

### 2.2 UI Components

| Component | Purpose |
|-----------|---------|
| `Button` | Variants: primary (teal), secondary, outline, ghost. Sizes: sm, md, lg |
| `Badge` | Temperature badges (hot=amber, warm=yellow, cold=blue), experience badges |
| `Card` | Generic wrapper with hover lift effect |
| `SpringCard` | Photo, name, location, badges, links to detail |
| `SpringGrid` | Responsive 1/2/3 column grid |
| `SpringFilters` | Toggle buttons for type/experience, state dropdown |
| `SpringSearch` | Debounced search with URL params |

### 2.3 Homepage

- `SearchHero`: Large search bar, tagline, background with subtle texture
- `FilterToggles`: Quick filter buttons (Hot/Warm/Cold, Resort/Primitive/Hybrid)
- `FeaturedSprings`: 6-spring grid of highlighted locations

### 2.4 API Routes

| Endpoint | Purpose |
|----------|---------|
| `GET /api/springs` | List/search with params: q, state, type, experience, limit, offset |
| `GET /api/springs/[slug]` | Single spring + nearby springs |
| `GET /api/states` | List states with spring counts |
| `GET /api/nearby` | Springs near lat/lng within radius |

---

## Day 3: Detail Pages + Maps ✅ COMPLETED

### 3.1 Spring Detail Page (`/springs/[slug]`) ✅

- H1: Spring name
- Badges: temperature type, experience type
- Location: State, coordinates
- Map: MapLibre single marker with popup
- "Get Directions" button (opens Google Maps)
- Description
- Info cards: access, parking, fees, crowds, etc.
- Nearby springs (5 closest)

### 3.2 State Page (`/states/[state]`) ✅

- H1: "Natural Springs in [State]"
- Spring count stats (hot, warm, cold)
- URL-based filter toggles (StateFilters component)
- Multi-marker interactive map
- Spring grid with filtering

### 3.3 MapLibre Integration ✅

- Dynamic import with `ssr: false` via `src/components/maps/index.tsx`
- Free tiles: OpenStreetMap
- `SingleSpringMap` component for detail pages
- `SpringMap` component for state pages with markers
- Navigation controls and popups
- Color-coded markers by spring type (terracotta/moss/river)

---

## Day 3.5: Activity Pairing Pages

### Near Pages (`/near/[location]`)

**Examples:**
- `/near/denver-co` - "Hot Springs Near Denver"
- `/near/austin-tx` - "Swimming Holes Near Austin"
- `/near/boise-id` - "Natural Springs Near Boise"

**Implementation:**
- Create 10-15 seed locations (major cities in spring-rich states)
- Use PostGIS `ST_DWithin` to find springs within 100 miles
- Group by spring type (hot/cold) in the results
- Include driving distance estimates

**Page structure:**
- H1: "[Spring Type] Near [City]"
- Intro paragraph (SEO-focused)
- Map with all nearby springs
- Spring grid grouped by distance bands (0-25mi, 25-50mi, 50-100mi)

**Seed cities file:** `scripts/data/seed-cities.ts`
```typescript
export const SEED_CITIES = [
  { slug: 'denver-co', name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { slug: 'austin-tx', name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { slug: 'boise-id', name: 'Boise', state: 'ID', lat: 43.6150, lng: -116.2023 },
  // ... 12 more
];
```

---

## Day 4: Data Pipeline + SEO + Polish

### 4.1 Data Sources (Validated Dec 19, 2024)

**Primary Sources (bulk import):**
| Source | Springs | Has Coords | Notes |
|--------|---------|------------|-------|
| **swimmingholes.org** | ~1,400 | ✅ lat/lon in HTML tables | All 50 states, hot + cold, structured fields |
| **USGS GNIS** | ~1,600 | ✅ official coords | Hot springs only, download as TSV |
| **idahohotsprings.com** | ~200 | ✅ GPS table | Idaho only, easy HTML table |

**Enrichment (per-spring):**
- **Tavily** → Wikipedia, BLM.gov, travel blogs (tested: works well)
- **gpt-4o-mini** → Extract structured JSON from snippets

**QA/Cross-reference (manual, don't scrape):**
- **findaspring.org** - Nonprofit, use for verification only
- **BLM.gov / Forest Service** - Official land management, closures
- **Recent blog posts** - Tavily can surface trip reports for freshness
- **Google Maps** - Only useful for resort-type springs with business listings

### 4.2 Data Pipeline Scripts

| Script | Source | Expected Count |
|--------|--------|----------------|
| `01-import-gnis.ts` | USGS GNIS hot springs | ~1,600 |
| `02-scrape-swimmingholes.ts` | swimmingholes.org | ~1,400 |
| `03-scrape-idaho.ts` | idahohotsprings.com GPS | ~200 |
| `04-enrich-springs.ts` | Tavily + gpt-4o-mini | 1,000 enriched |
| `05-validate-data.ts` | Zod validation + dedup | All |

**Run order:**
```bash
npx tsx scripts/run-pipeline.ts gnis swimmingholes idaho  # Day 1-2
npx tsx scripts/run-pipeline.ts enrich                     # Day 3-4
npx tsx scripts/run-pipeline.ts validate                   # Day 4
```

**Estimated cost:** ~$15-30 total (Tavily ~$10-20, OpenAI ~$5-10)

### 4.3 swimmingholes.org Data Fields

Each entry contains (verified via scrape test):
- Name, State, Towns
- **lat/lon** with accuracy notes (exact, approximate, general area)
- Water type: hot spring, river, falls, creek
- Description, Directions (detailed)
- Fee, Facilities, Sanction status
- Bathing suits policy
- Camping availability
- Confidence level, Verified status, Last updated date

### 4.4 USGS GNIS Data Fields

Download: https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/DomesticNames/DomesticNames_National.txt

Pipe-delimited with:
- feature_id, feature_name, feature_class (filter: "Spring")
- state_alpha, county_name
- prim_lat_dec, prim_long_dec (decimal degrees)
- elev_in_ft

### 4.5 Image Pipeline

**Strategy:** Own all images in Supabase Storage (no hotlinking)

**Sources (CC-licensed / public domain):**
- Wikipedia Commons - reliable, ~30% of springs have photos
- BLM.gov / Recreation.gov / NPS - public domain
- swimmingholes.org - download, don't hotlink

**Pipeline script:** `scripts/06-fetch-images.ts`
1. For each spring, search for image URLs (Tavily or direct scrape)
2. Download to temp directory
3. Resize/optimize: WebP format, max 1200px width, ~80% quality
4. Upload to Supabase bucket: `springs/{slug}/main.webp`
5. Store public URL in `photo_url` field

**Bucket setup:**
```sql
-- Supabase Storage bucket (via dashboard or API)
-- Name: springs
-- Public: Yes
-- File size limit: 5MB
-- Allowed types: image/webp, image/jpeg, image/png
```

**Naming convention:**
```
springs/
  goldbug-hot-springs-id/
    main.webp        # Primary photo
    gallery-1.webp   # Future: additional photos
    gallery-2.webp
```

**Dependencies:**
```bash
npm install sharp  # Image processing
```

### 4.6 SEO

- Dynamic metadata on all pages (title, description, og:image)
- `sitemap.ts` for dynamic sitemap generation
- Structured data (LocalBusiness schema on detail pages)
- ISR with `revalidate = 3600` (1 hour)
- `generateStaticParams` for pre-rendering top springs

### 4.7 Playwright Tests

- Homepage: search visible, filters work, URL updates
- Spring detail: info displays, map renders, directions link works
- State page: spring count shows, filters work, grid populates

### 4.8 Deploy

- Push to GitHub
- Connect to Vercel
- Add environment variables
- Deploy and test production

---

## Critical Files to Create

### Frontend
- `src/app/layout.tsx` - Root layout with fonts, providers
- `src/app/page.tsx` - Homepage
- `src/app/springs/[slug]/page.tsx` - Spring detail
- `src/app/states/[state]/page.tsx` - State listing
- `src/app/near/[location]/page.tsx` - Activity pairing (Near [City])
- `src/components/springs/SpringCard.tsx` - Main card component
- `src/components/maps/SpringMap.tsx` - MapLibre wrapper
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/lib/schemas/spring.ts` - Zod validation schemas

### Data Pipeline
- `scripts/01-import-gnis.ts` - USGS GNIS hot springs import
- `scripts/02-scrape-swimmingholes.ts` - swimmingholes.org scraper (all 50 states)
- `scripts/03-scrape-idaho.ts` - idahohotsprings.com GPS table
- `scripts/04-enrich-springs.ts` - Tavily + gpt-4o-mini enrichment
- `scripts/05-validate-data.ts` - Zod validation, dedup, QA flagging
- `scripts/06-fetch-images.ts` - Download, optimize, upload to Supabase Storage
- `scripts/lib/validation.ts` - Enum enforcement with Zod
- `scripts/lib/auto-correct.ts` - Fix common LLM mistakes ("crowded" → "busy")
- `scripts/run-pipeline.ts` - Pipeline orchestrator
- `scripts/data/seed-cities.ts` - 15 cities for activity pairing pages

### Config
- `playwright.config.ts` - E2E test configuration
- `next.config.ts` - Next.js configuration

---

## Key Decisions Made

1. **Parallel track**: Schema + basic UI on day 1, data pipeline runs while iterating UI
2. **Full MapLibre**: Interactive maps with clustering (not static images)
3. **USGS GNIS** instead of NOAA (NOAA decommissioned May 2025)
4. **gpt-4o-mini** for extraction (cost-effective at ~$0.15/1M input tokens)
5. **Organic/editorial aesthetic** with Space Grotesk + Newsreader fonts
6. **URL-based filter state** for SEO and shareability

---

## Patterns from DDD Project (Reference)

### Supabase Client Pattern
```typescript
// lib/supabase.ts - Singleton with lazy init
let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!_supabase) {
    _supabase = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

// Centralized db object with typed queries
export const db = {
  async getSprings() { /* select with relationships */ },
  async getSpringBySlug(slug: string) { /* ... */ },
  async getSpringsSlugs() { /* lightweight for sitemap */ },
  // ... all database access methods
}
```

### Server Component Data Fetching
```typescript
// Parallel data fetching
const [springs, stats, featured] = await Promise.all([
  db.getSprings(),
  db.getStats(),
  db.getFeaturedSprings(6),
]);
```

### ISR Caching Strategy
```typescript
// Homepage: hourly
export const revalidate = 3600;

// Detail pages: daily
export const revalidate = 86400;
```

### Schema.org Generators
```typescript
// lib/schema.ts
export function generateSpringSchema(spring: Spring) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: spring.name,
    description: spring.description,
    geo: { '@type': 'GeoCoordinates', latitude: spring.lat, longitude: spring.lng },
    // ...
  };
}
```



## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| MapLibre SSR errors | Dynamic import with `ssr: false` |
| Data quality issues | Strict Zod validation + auto-correction |
| swimmingholes.org scraping | Respectful rate limiting (0.5 req/sec), fallback to manual if blocked |
| Time pressure | Activity pairing pages are simple (reuse existing components) |
| Free tile limits | Monitor usage, have backup tile source |
