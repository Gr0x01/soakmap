---
Last-Updated: 2025-12-22
Maintainer: RB
Status: Launched
---

# Quickstart: SoakMap

## Current State

- **Status**: Live at [soakmap.com](https://www.soakmap.com)
- **Launched**: December 19, 2025
- **Data**: 2,956 springs across 45+ states
- **Pages**: 3,184 static pages (springs, states, types, tags)
- **Photos**: 2,212 springs with Wikimedia Commons images (75%)

---

## What It Is

> "Find the right natural spring for YOUR trip - resort soak or primitive swimming hole."

A curated directory of natural hot springs and swimming holes with filtering by:
- **Temperature**: Hot (100°F+), Warm (70-99°F), Cold (<70°F)
- **Experience**: Resort, Primitive, Hybrid
- **Access**: Drive-up to difficult hike
- **Features**: Free, clothing-optional, etc.

---

## Key Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run type-check       # TypeScript verification

# Testing
npm run test:e2e         # Playwright tests
npm run test:e2e:ui      # Interactive mode

# Data Pipeline (see architecture/data-pipeline.md for details)
npx tsx scripts/run-pipeline.ts all              # Full pipeline
npx tsx scripts/04-enrich-springs.ts --limit 50  # Enrich springs
npx tsx scripts/05-validate-data.ts --fix        # Validate + fix
```

---

## Page Structure

| Route | Count | Purpose |
|-------|-------|---------|
| `/springs/[slug]` | 2,956 | Individual spring pages |
| `/[state]` | 50 | State browse pages |
| `/[state]/[filter]` | 106 | State + type combos |
| `/type/[type]` | 3 | National type pages |
| `/tag/[tag]` | 5 | Tag pages (free, primitive, etc.) |
| `/near/[location]` | 15 | City proximity pages |

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Enrichment (scripts only)
OPENAI_API_KEY=...
TAVILY_API_KEY=...

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Milestones

| Phase | Date | Outcome |
|-------|------|---------|
| Project Setup | Dec 19 | Next.js + Supabase + PostGIS |
| Data Pipeline | Dec 19 | 8 scrapers, 2,956 springs |
| Core Pages | Dec 19 | Detail + state + near pages |
| Enrichment | Dec 21 | LLM descriptions + photos |
| SEO Pages | Dec 21 | Type, tag, state+type combos |
| Launch | Dec 21 | Live on Vercel |
| IndexNow | Dec 21 | 3,123 URLs submitted |

---

## Documentation

| Doc | Purpose |
|-----|---------|
| `development/activeContext.md` | Current focus + next steps |
| `development/progress.md` | Milestones + costs |
| `architecture/techStack.md` | Technology decisions |
| `architecture/data-pipeline.md` | Scripts + enrichment system |
