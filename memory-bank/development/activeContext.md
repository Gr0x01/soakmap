---
title: Active Development Context
created: 2025-12-19
last-updated: 2025-12-22
maintainer: Claude
status: Active
---

# Active Development Context

**Status:** Live at soakmap.com
**Focus:** SEO indexing + monitoring

---

## Current State

### Infrastructure
- Next.js on Vercel (production)
- Supabase PostgreSQL + PostGIS
- MapLibre GL for maps

### Data
- **2,956 springs** across 45+ states
- **2,212 photos** (75% coverage) from Wikimedia Commons
- All springs enriched with LLM descriptions

### Pages
- **3,184 static pages** generated at build
- Spring detail, state, type, tag, and near pages
- Full JSON-LD schema markup

---

## Immediate Next Steps

1. **Google Search Console**
   - Submit sitemap: `https://www.soakmap.com/sitemap.xml`
   - Google doesn't support IndexNow

2. **Monitor Indexing**
   - Bing Webmaster Tools - check IndexNow status
   - Track keyword rankings (swimming holes, hot springs)

3. **IndexNow** (completed Dec 21)
   - 3,123 URLs submitted (HTTP 200)
   - Script: `npx tsx scripts/submit-indexnow.ts`

---

## Key Commands

```bash
# Development
npm run dev              # localhost:3000
npm run build            # Production build
npm run type-check       # TypeScript

# Data Pipeline
npx tsx scripts/04-enrich-springs.ts --limit 50
npx tsx scripts/05-validate-data.ts --fix
npx tsx scripts/11-generate-seo-narratives.ts --limit 100
npx tsx scripts/12-fetch-photos.ts

# SEO
npx tsx scripts/submit-indexnow.ts
```

---

## Environment

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
