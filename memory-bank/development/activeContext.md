---
title: Active Development Context
created: 2025-12-19
last-updated: 2025-12-20
maintainer: Claude
status: Active
---

# Active Development Context

**Current Phase:** Phase 5 - Data Import Complete (3,070 springs)
**Status:** Ready for enrichment and homepage polish
**Focus:** Enrichment + homepage polish + deploy

---

## Current State

### Infrastructure
- ✅ Memory bank initialized
- ✅ CLAUDE.md configured
- ✅ Subagents configured
- ✅ Frontend design skill installed
- ✅ Next.js project created (Day 1)
- ✅ Supabase project created with PostGIS + schema

### Data Pipeline (8 Sources)
- ✅ `01-import-gnis.ts` - USGS per-state hot springs (550 springs)
- ✅ `02-scrape-swimmingholes.ts` - Enhanced with sub-place parsing (1,116 springs)
- ✅ `03-scrape-idaho.ts` - idahohotsprings.com (9 springs)
- ✅ `04-enrich-springs.ts` - Tavily + gpt-4o-mini enrichment
- ✅ `05-validate-data.ts` - Zod validation + duplicate merge
- ✅ `06-scrape-soakoregon.ts` - soakoregon.com (32 springs)
- ✅ `07-import-pangaea.ts` - PANGAEA NOAA dataset (1,065 springs)
- ✅ `08-scrape-wikipedia.ts` - Wikipedia with article fetching (48 springs)
- ✅ `09-scrape-hotspringslocator.ts` - hotspringslocator.com (53 springs)
- ✅ `10-scrape-tophotsprings.ts` - tophotsprings.com 24 states (197 springs)
- ✅ `lib/dedup.ts` - Pre-insert dedup + merge utilities

### Frontend (Day 3.5 Complete)
- ✅ Spring detail page (`/springs/[slug]`)
- ✅ State page (`/states/[state]`)
- ✅ Near page (`/near/[location]`) - 15 seed cities
- ✅ MapLibre integration (SingleSpringMap, SpringMap)
- ✅ StateFilters component (URL-based filtering)
- ✅ SpringCard with optional distance display
- ✅ Error boundaries for maps
- ✅ Accessibility: ARIA labels, keyboard navigation

### Database
- ✅ **3,070 springs** across 8 sources (deduplicated)
- ✅ State counts working (45+ states with springs)
- ✅ `nearby_springs()` extended with lat/lng/photo_url
- ✅ Pre-insert + post-import deduplication system

---

## Data Import Summary (December 20, 2025)

| Source | Count | Notes |
|--------|-------|-------|
| swimmingholes.org | 1,116 | Sub-place parsing, western US focus |
| PANGAEA NOAA | 1,065 | Historical geothermal data (1980s) |
| USGS GNIS | 550 | Authoritative coordinates |
| tophotsprings.com | 197 | 24 US states, excellent descriptions |
| hotspringslocator.com | 53 | 6 western states, GPS + chemistry |
| Wikipedia | 48 | Rich history and descriptions |
| soakoregon.com | 32 | Oregon-focused, detailed access info |
| idahohotsprings.com | 9 | Idaho-focused |
| **Total** | **3,070** | Clean, deduplicated |

---

## Immediate Next Steps

1. **Run Enrichment** (API keys configured in .env.local)
   ```bash
   npx tsx scripts/04-enrich-springs.ts --limit 100  # Start with 100
   ```

2. **Polish Homepage**
   - Connect to real data (3,070 springs available)
   - Verify filters work with Supabase
   - Add loading states

3. **Deploy** (Day 4)
   - ✅ sitemap.ts - Dynamic sitemap at /sitemap.xml
   - ✅ Structured data - TouristAttraction + BreadcrumbList schemas
   - Deploy to Vercel

---

## Recently Completed (Day 5 - Extended Data Import)

### New Scrapers Built
- **PANGAEA NOAA Import** (`07-import-pangaea.ts`)
  - 1,065 springs from NOAA's 1980-1981 geothermal survey
  - Tab-delimited dataset with temperature data
  - Fixed missing `experience_type` field bug

- **Wikipedia Scraper** (`08-scrape-wikipedia.ts`)
  - Parses List of hot springs in the United States
  - Fetches individual Wikipedia articles for rich content
  - Extracts coordinates from geo microformat
  - Falls back to Tavily API for missing coordinates

- **hotspringslocator.com Scraper** (`09-scrape-hotspringslocator.ts`)
  - 6 western states (CA, ID, MT, NV, OR, WA)
  - High-quality data: GPS, temperature, water chemistry, pH
  - State bounds validation for coordinate accuracy

- **tophotsprings.com Scraper** (`10-scrape-tophotsprings.ts`)
  - 24 US states (including eastern states: FL, AR, NC, NY, etc.)
  - Coordinates from Google Maps embeds
  - Excellent descriptions from individual pages
  - Filters out non-spring pages and international content

### Data Growth
- Started session: 2,820 springs
- Added from hotspringslocator.com: +53 springs
- Added from tophotsprings.com: +197 springs
- **Final count: 3,070 springs**

---

## Key Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run type-check             # TypeScript verification

# Testing
npm run test:e2e               # Playwright tests
npm run test:e2e:ui            # Interactive test mode

# Data Pipeline - All Scrapers
npx tsx scripts/01-import-gnis.ts
npx tsx scripts/02-scrape-swimmingholes.ts
npx tsx scripts/03-scrape-idaho.ts
npx tsx scripts/06-scrape-soakoregon.ts
npx tsx scripts/07-import-pangaea.ts
npx tsx scripts/08-scrape-wikipedia.ts
npx tsx scripts/09-scrape-hotspringslocator.ts
npx tsx scripts/10-scrape-tophotsprings.ts

# Enrichment
npx tsx scripts/04-enrich-springs.ts --limit 100

# Validation
npx tsx scripts/05-validate-data.ts
npx tsx scripts/05-validate-data.ts --fix-duplicates

# Dry runs
npx tsx scripts/10-scrape-tophotsprings.ts --dry-run --state ID --limit 5
```

---

## Environment

**Required Keys (configured in .env.local):**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `OPENAI_API_KEY` (for enrichment)
- ✅ `TAVILY_API_KEY` (for enrichment)

---

## Related Documents

- `core/quickstart.md` - Project overview
- `core/projectbrief.md` - Full product spec
- `architecture/techStack.md` - Technology decisions
- `projects/implementation-plan.md` - Detailed implementation plan
