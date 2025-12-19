---
title: Active Development Context
created: 2025-12-19
last-updated: 2025-12-19
maintainer: Claude
status: Active
---

# Active Development Context

**Current Phase:** Phase 3 - Activity Pairing Complete
**Status:** All core pages implemented (detail, state, near)
**Focus:** Data import + SEO polish + deploy

---

## Current State

### Infrastructure
- ✅ Memory bank initialized
- ✅ CLAUDE.md configured
- ✅ Subagents configured
- ✅ Frontend design skill installed
- ✅ Next.js project created (Day 1)
- ✅ Supabase project created with PostGIS + schema

### Data Pipeline (Security-Hardened)
- ✅ `01-import-gnis.ts` - USGS per-state hot springs import (adm-zip, cheerio, timeouts)
- ✅ `02-scrape-swimmingholes.ts` - Swimming holes scraper (cheerio HTML parser, tested: 19 CA)
- ✅ `04-enrich-springs.ts` - Tavily + gpt-4o-mini (validated responses, 429 retry w/ backoff)
- ✅ `05-validate-data.ts` - Zod validation (grid-based O(n) dedup, fixed Alaska bounds)
- ✅ `run-pipeline.ts` - Pipeline orchestrator

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
- ✅ 902+ springs imported (USGS + swimmingholes.org)
- ✅ State counts working
- ✅ `nearby_springs()` extended with lat/lng/photo_url
- ✅ All validation passing

---

## Immediate Next Steps

1. **Run Full Import**
   ```bash
   npx tsx scripts/02-scrape-swimmingholes.ts  # All 50 states (~1,400 springs)
   npx tsx scripts/01-import-gnis.ts           # USGS hot springs (~1,600)
   npx tsx scripts/05-validate-data.ts         # Validate + dedupe
   ```

2. **Run Enrichment** (requires OPENAI_API_KEY + TAVILY_API_KEY)
   ```bash
   npx tsx scripts/04-enrich-springs.ts --limit 100  # Start with 100
   ```

3. **Polish Homepage**
   - Connect to real data
   - Verify filters work with Supabase
   - Add loading states

4. **Deploy** (Day 4)
   - ✅ sitemap.ts - Dynamic sitemap at /sitemap.xml
   - ✅ Structured data - TouristAttraction + BreadcrumbList schemas
   - Deploy to Vercel

---

## Recently Completed (Day 3.5)

### Activity Pairing Pages (`/near/[location]`)
- 15 seed cities in spring-rich states (CO, ID, UT, TX, OR, WA, CA, AZ, NM, NV, MT)
- Distance-based grouping (0-25mi, 25-50mi, 50-100mi)
- SpringCard extended with distance badge
- Reuses SpringMap, StateFilters components
- SEO metadata for each city
- ISR with hourly revalidation

**Files created:**
- `src/lib/data/seed-cities.ts` - 15 cities with coordinates
- `src/lib/data/cities.ts` - Helper functions
- `src/app/near/[location]/page.tsx` - Near page
- `src/components/springs/StatCard.tsx` - Shared stat card component
- `src/lib/utils/spring-filters.ts` - Shared filter utility
- `supabase/migrations/002_extend_nearby_springs.sql` - DB migration (applied)

**Code review fixes:**
- URL injection prevention (use validated city.slug)
- Case-insensitive slug matching
- Distance boundary edge case at 100mi
- ARIA labels for distance badges
- Extracted duplicate code to shared components

---

## Day 3 Completed

### Spring Detail Page (`/springs/[slug]`)
- Hero with photo/gradient placeholder + badges
- Interactive MapLibre map with marker
- "Get Directions" button (Google Maps link)
- Info cards grid (access, parking, fees, crowds, etc.)
- Safety warnings section
- Nearby springs (5 closest with distance)
- Dynamic SEO metadata
- ISR with hourly revalidation

### State Page (`/states/[state]`)
- Hero with state name and description
- Stats cards (hot/warm/cold counts)
- URL-based filtering via StateFilters component
- Interactive SpringMap with all state springs
- SpringGrid with filtered results
- Empty state handling

### MapLibre Components
- `SingleSpringMap` - Detail page single marker
- `SpringMap` - Multi-marker with auto-bounds
- Dynamic imports (SSR disabled)
- OpenStreetMap tiles
- Color-coded markers by spring type
- Error boundaries with retry

### Security Fixes (Code Review)
- XSS prevention: `escapeHtml()` for popup content
- Open redirect prevention: slug validation + Next.js router
- Memory leak prevention: proper event listener cleanup
- Type validation for URL filter params

### Accessibility
- `aria-pressed` and `aria-label` on filter buttons
- `role="group"` for filter sections
- Keyboard navigation (Enter/Space) for map markers
- `role="application"` on map containers

---

## Technical Debt

None - clean implementation with security review completed.

---

## Environment

**Required Keys (configured in .env.local):**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ⏳ `OPENAI_API_KEY` (for enrichment)
- ⏳ `TAVILY_API_KEY` (for enrichment)

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

# Data Pipeline
npx tsx scripts/run-pipeline.ts                    # Show help
npx tsx scripts/run-pipeline.ts swimmingholes      # Scrape all states
npx tsx scripts/run-pipeline.ts gnis               # Import USGS data
npx tsx scripts/run-pipeline.ts enrich --limit 50  # Enrich 50 springs
npx tsx scripts/run-pipeline.ts validate           # Validate + update counts
npx tsx scripts/run-pipeline.ts all                # Run entire pipeline

# Individual scripts with options
npx tsx scripts/02-scrape-swimmingholes.ts --state CA --limit 10 --dry-run
npx tsx scripts/04-enrich-springs.ts --state ID --limit 20
npx tsx scripts/05-validate-data.ts --fix
```

---

## Related Documents

- `core/quickstart.md` - Project overview
- `core/projectbrief.md` - Full product spec
- `architecture/techStack.md` - Technology decisions
- `projects/implementation-plan.md` - Detailed implementation plan
