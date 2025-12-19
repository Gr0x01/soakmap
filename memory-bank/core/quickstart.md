---
Last-Updated: 2025-12-19
Maintainer: RB
Status: Phase 0 - Pre-Development
---

# Quickstart: SoakMap

## Current Status
- **Phase**: Phase 0 - Pre-Development
- **Version**: 0.0.0
- **Environment**: Not yet deployed
- **Data Target**: 1,000 springs at launch (3,500 full dataset)
- **Build Time**: 4 days

---

## What We're Building

> "Find the right natural spring for YOUR trip - resort soak or primitive swimming hole."

A curated directory of natural hot springs and swimming holes with classification by:
- **Temperature**: Hot (100°F+), Warm (70-99°F), Cold (<70°F)
- **Experience**: Resort, Primitive, Hybrid

### Target Competitors
- findaspring.com
- swimmingholes.org

### Differentiation
- Temperature-based discovery (hot for winter soaking, cold for summer swimming)
- Experience classification (resort vs primitive vs hybrid)
- Better UX and filtering
- Modern, mobile-first design

---

## Data Pipeline

```
NOAA Database (~1,661 hot springs)
         +
swimmingholes.org (~1,400 swimming holes)
         ↓
Tavily discovery (~500 more)
         ↓
Tavily enrichment (snippets per spring)
         ↓
4o-mini extraction (raw text → structured JSON)
         ↓
Validation layer (enforce enums)
         ↓
Manual QA (top 100)
         ↓
Production database (1,000 launch)
```

---

## Tech Stack (Planned)

- **Frontend**: Next.js 14+, React 18+, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **Maps**: MapLibre GL JS (free, open-source)
- **Data Enrichment**: OpenAI gpt-4o-mini, Tavily
- **Deployment**: Vercel
- **Analytics**: PostHog

---

## Key Commands (TBD)

```bash
# Development
npm run dev              # Start development server (localhost:3000)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript checks

# Testing
npm run test:e2e         # Run Playwright tests
npm run test:e2e:ui      # Interactive test mode

# Data Operations (to be created)
npx tsx scripts/import-noaa.ts           # Import NOAA hot springs
npx tsx scripts/scrape-swimmingholes.ts  # Scrape swimming holes
npx tsx scripts/discover-springs.ts      # Tavily discovery
npx tsx scripts/enrich-springs.ts        # LLM enrichment
npx tsx scripts/validate-data.ts         # Validation layer
```

---

## Pages Required

| Page Type | Count | Purpose |
|-----------|-------|---------|
| Homepage | 1 | Search + filters + featured |
| State pages | 50 | SEO + browsing |
| Spring detail | 1,000 | Individual listings |
| Activity pairing | 10-15 | "Near [city]" SEO pages |

---

## Environment Variables (TBD)

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_key

# Optional
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `development/activeContext.md` | Current sprint focus |
| `development/progress.md` | Work log |
| `architecture/techStack.md` | Technology decisions |
| `architecture/data-schema.md` | Field definitions and enums |
