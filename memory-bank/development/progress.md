---
Last-Updated: 2025-12-21
Maintainer: RB
Status: Phase 7 - SEO Pages Complete
---

# Progress Log: SoakMap

## Project Timeline

**Project Start**: December 19, 2025
**Current Phase**: Phase 7 - SEO Pages Complete (3,184 static pages)
**Build Target**: 4 days (extended for data import + enrichment + SEO)

## Key Milestones

| # | Phase | Status | Target |
|---|-------|--------|--------|
| 0 | Project Setup | ✅ Complete | Day 0 |
| 1 | Data Pipeline | ✅ Complete | Day 1 |
| 2 | Core Pages | ✅ Complete | Day 2-3 |
| 3 | Activity Pairing | ✅ Complete | Day 3.5 |
| 4 | Extended Data Import | ✅ Complete | Day 4-5 |
| 5 | Enrichment | ✅ Complete | Day 5-6 |
| 6 | SEO Landing Pages | ✅ Complete | Day 6 |
| 7 | Launch | ✅ Complete | Dec 29, 2025 |

---

## Detailed Work Log

### December 21, 2025 - Day 6: SEO Landing Pages

**New Page Types Created:**
- ✅ **National Type Pages** (`/type/[type]/`)
  - `/type/hot-springs/` - targets "hot springs" (450K vol)
  - `/type/swimming-holes/` - targets "swimming holes" (22K vol, KD 30)
  - `/type/warm-springs/` - targets "warm springs"
  - 500+ words editorial content, FAQs with schema markup

- ✅ **Tag Pages** (`/tag/[tag]/`)
  - `/tag/free/` - targets "free hot springs" (880 vol)
  - `/tag/clothing-optional/` - targets "clothing optional hot springs" (1.3K vol, KD 19)
  - `/tag/primitive/` - primitive experience springs
  - `/tag/resort/` - resort experience springs
  - `/tag/drive-up/` - easy access springs
  - 400+ words editorial, state breakdown, FAQs

- ✅ **State + Type Combos** (`/[state]/[filter]/`)
  - 106 pages like `/ca/hot-springs/`, `/or/swimming-holes/`
  - Targets keywords like "hot springs california" (15K vol, KD 47)
  - Auto-generated content templates per state+type

**URL Structure Migration:**
- State pages moved from `/states/ca/` to `/ca/` (shorter URLs)
- 301 redirects preserve SEO value from old URLs
- Query param filters now have dedicated URLs

**Technical Implementation:**
- `getSpringsByTag()` added to server.ts with input validation
- HTML sanitization for editorial content (defense-in-depth)
- Footer updated with type and tag navigation links
- Sitemap includes all new page types

**Build Stats:**
- **3,184 total static pages** generated
- Build time: ~8 seconds for static generation
- All pages have canonical URLs, OpenGraph, structured data

**Files Created:**
- `src/app/type/[type]/page.tsx`
- `src/app/[state]/page.tsx` (migrated from /states/)
- `src/app/[state]/[filter]/page.tsx`
- `src/app/tag/[tag]/page.tsx`
- `src/lib/data/type-content.ts`
- `src/lib/data/tag-content.ts`
- `src/lib/data/state-type-content.ts`

---

### December 21, 2025 - Day 6: Full Enrichment Run

**Enrichment Pipeline Completed:**
- ✅ **Structured Data (Step 1):** 2,931 springs enriched
  - Tavily `search_depth: advanced` for ~1400 chars per spring
  - gpt-4o-mini extraction to structured JSON
  - ~19 minutes, 0 errors

- ✅ **SEO Descriptions (Step 2):** All springs have markdown descriptions
  - gpt-4.1-mini for prose quality
  - 50 concurrent requests (Tier 5 OpenAI)
  - Markdown format with H2 headers (About, Getting There, What to Expect, Tips)
  - Total cost: ~$1.65 (~$0.90 + $0.75)

- ✅ **Photos (Step 3):** 2,212 springs (75%) have Wikimedia Commons photos
  - Wikimedia Commons API only (Tavily returned garbage)
  - Filtered: maps, logos, SVGs, small images
  - 744 springs without photos (mostly obscure/remote)

**Pipeline Improvements:**
- Added `MarkdownContent` component for rendering descriptions with react-markdown
- Updated SEO prompt to generate structured markdown with headers
- Fixed script concurrency (10 → 50 for Tier 5 OpenAI)
- Removed unnecessary delays in photo fetch script
- Cleaned 312 bad Tavily photos (Pinterest, random blogs)

**New Scripts:**
- `12-fetch-photos.ts` - Wikimedia Commons photo fetching

---

### December 20, 2025 - Day 5: Extended Data Import

**New Scrapers Built:**
- ✅ `07-import-pangaea.ts` - PANGAEA NOAA dataset (1,065 springs)
- ✅ `08-scrape-wikipedia.ts` - Wikipedia list + article fetching (48 springs)
- ✅ `09-scrape-hotspringslocator.ts` - 6 western states (53 springs)
- ✅ `10-scrape-tophotsprings.ts` - 24 US states (197 springs)

**Data Import Results:**
| Source | Count | Notes |
|--------|-------|-------|
| swimmingholes.org | 1,116 | Sub-place parsing, western US |
| PANGAEA NOAA | 1,065 | Historical geothermal (1980s) |
| USGS GNIS | 550 | Authoritative coordinates |
| tophotsprings.com | 197 | 24 states, excellent descriptions |
| hotspringslocator.com | 53 | GPS, chemistry, pH data |
| Wikipedia | 48 | Rich history and descriptions |
| soakoregon.com | 32 | Oregon-focused |
| idahohotsprings.com | 9 | Idaho-focused |
| **Total** | **3,070** | Clean, deduplicated |

**Technical Highlights:**
- Wikipedia scraper fetches individual articles for rich content
- Extracts coordinates from geo microformat (`span.geo`)
- tophotsprings.com covers eastern states (FL, AR, NC, NY, etc.)
- Coordinates from Google Maps embeds (`!2d{lng}!3d{lat}`)
- Fixed PANGAEA importer missing `experience_type` field

---

### December 19, 2025 - Day 4: Initial Data Pipeline Enhancement

**Deduplication System:**
- ✅ Pre-insert dedup: Scrapers check against existing DB
- ✅ Post-import merge: `--fix-duplicates` flag
- ✅ Smart matching: Normalized name + state OR proximity + name similarity
- ✅ Richness scoring: Keeps entry with most data

**Additional Scrapers:**
- ✅ `03-scrape-idaho.ts` - idahohotsprings.com (9 springs)
- ✅ `06-scrape-soakoregon.ts` - soakoregon.com (32 springs)

**swimmingholes.org Enhancement:**
- 3x more data: 327 → 1,100 entries
- Parses area sub-places like "CHICO AREA [6 PLACES]"
- Multiple regex patterns for HTML variations

---

### December 19, 2025 - Day 3.5: Activity Pairing Pages

**Near Pages (`/near/[location]`):**
- ✅ 15 seed cities in spring-rich states
- ✅ Distance-based grouping (0-25mi, 25-50mi, 50-100mi)
- ✅ SpringCard extended with distance badge
- ✅ SEO metadata with canonical URLs

**Code Review Fixes:**
- ✅ URL injection prevention
- ✅ Case-insensitive slug matching
- ✅ ARIA labels for distance badges

**Files Created:**
- `src/lib/data/seed-cities.ts`
- `src/lib/data/cities.ts`
- `src/app/near/[location]/page.tsx`
- `src/components/springs/StatCard.tsx`

---

### December 19, 2025 - Day 3: Core Pages + Maps

**Spring Detail Page (`/springs/[slug]`):**
- ✅ Hero section with photo/gradient placeholder
- ✅ Interactive MapLibre map with single marker
- ✅ Info cards grid (access, parking, fees, etc.)
- ✅ Nearby springs section (5 closest)

**State Page (`/states/[state]`):**
- ✅ Hero with state name and spring counts
- ✅ URL-based filtering (StateFilters component)
- ✅ Interactive SpringMap with all state springs

**MapLibre Integration:**
- ✅ `SingleSpringMap` - Detail page
- ✅ `SpringMap` - Multi-marker with auto-bounds
- ✅ Error boundaries with retry

**Security Fixes:**
- ✅ XSS prevention: `escapeHtml()` for popup content
- ✅ Open redirect prevention: slug validation
- ✅ Memory leak prevention: event listener cleanup

---

### December 19, 2025 - Day 1: Foundation

**Project Structure:**
- ✅ Memory bank initialized
- ✅ CLAUDE.md configured
- ✅ Next.js project with TypeScript, Tailwind, App Router

**Supabase Schema:**
- ✅ 12 enums created
- ✅ Springs table with PostGIS location
- ✅ States table with counts
- ✅ nearby_springs() function

**Data Pipeline:**
- ✅ `01-import-gnis.ts` - USGS hot springs
- ✅ `02-scrape-swimmingholes.ts` - Swimming holes
- ✅ `04-enrich-springs.ts` - Tavily + gpt-4o-mini
- ✅ `05-validate-data.ts` - Validation + state counts

---

## Data Scripts Summary

| Script | Source | Springs | Notes |
|--------|--------|---------|-------|
| `01-import-gnis.ts` | USGS GNIS | 550 | Authoritative names/coords |
| `02-scrape-swimmingholes.ts` | swimmingholes.org | 1,116 | Sub-place parsing |
| `03-scrape-idaho.ts` | idahohotsprings.com | 9 | Idaho focus |
| `06-scrape-soakoregon.ts` | soakoregon.com | 32 | Oregon focus |
| `07-import-pangaea.ts` | PANGAEA NOAA | 1,065 | Historical data |
| `08-scrape-wikipedia.ts` | Wikipedia | 48 | Rich history |
| `09-scrape-hotspringslocator.ts` | hotspringslocator.com | 53 | GPS + chemistry |
| `10-scrape-tophotsprings.ts` | tophotsprings.com | 197 | 24 US states |

---

## Architecture (Implemented)

### Database Schema
- Core table: `springs` with 40+ fields
- 12 enum types for controlled vocabulary
- PostGIS for geographic queries
- Warnings as array type

### Frontend Components

**Layout:** Header, Footer
**UI:** Button, Badge, Card
**Springs:** SpringCard, SpringGrid, StateFilters, StatCard
**Maps:** SingleSpringMap, SpringMap, MapErrorBoundary
**Home:** SearchHero, FilterToggles, FeaturedSprings

---

## Cost Estimates

**Data Enrichment (actual - December 2025):**
- Tavily advanced search: ~$60 (2,931 springs × $0.02)
- OpenAI gpt-4o-mini (structured extraction): ~$5
- OpenAI gpt-4.1-mini (SEO narratives): ~$1.65
- **Total enrichment: ~$67**

**Ongoing (monthly):**
- Supabase: Free tier
- Vercel: Free tier
- MapLibre: $0 (open source)
- **Total: ~$0/month**
