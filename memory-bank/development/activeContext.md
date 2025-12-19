---
title: Active Development Context
created: 2025-12-19
last-updated: 2025-12-19
maintainer: Claude
status: Active
---

# Active Development Context

**Current Phase:** Phase 0 - Pre-Development
**Status:** Project structure initialized
**Focus:** Foundation setup

---

## Current State

### Infrastructure
- ✅ Memory bank initialized
- ✅ CLAUDE.md configured
- ✅ Subagents configured
- ✅ Frontend design skill installed
- ⏳ Next.js project not yet created
- ⏳ Supabase project not yet created

### Data
- ⏳ NOAA data not yet imported
- ⏳ swimmingholes.org not yet scraped
- ⏳ No springs in database

---

## Immediate Next Steps

1. **Create Next.js project**
   - Initialize with TypeScript, Tailwind, App Router
   - Set up ESLint, Prettier, Playwright

2. **Create Supabase project**
   - Set up database with PostGIS
   - Create springs schema with enums
   - Set up RLS policies

3. **Data Pipeline - Day 1**
   - Import NOAA hot springs (~1,661)
   - Scrape swimmingholes.org (~1,400)
   - Run Tavily discovery on 10 states
   - Extract with 4o-mini on 500 springs
   - Manual QA on top 100

---

## Technical Debt

None yet - clean slate!

---

## Environment

**Required Keys (TBD):**
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`

**Optional:**
- `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`

---

## Key Commands

```bash
# Development (once project exists)
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run type-check             # TypeScript verification

# Testing
npm run test:e2e               # Playwright tests
npm run test:e2e:ui            # Interactive test mode

# Data Operations (to be created)
npx tsx scripts/import-noaa.ts
npx tsx scripts/scrape-swimmingholes.ts
npx tsx scripts/enrich-springs.ts
```

---

## Related Documents

- `core/quickstart.md` - Project overview
- `core/projectbrief.md` - Full product spec
- `architecture/techStack.md` - Technology decisions
