---
Last-Updated: 2025-12-19
Maintainer: RB
Status: Planned
---

# Technology Stack: SoakMap

## Core Technologies

Modern web stack optimized for rapid development and minimal operational overhead. Inheriting proven architecture from DDD project.

### Backend
- **Runtime**: Node.js 18+ (via Next.js API routes)
- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL with PostGIS for geographic queries)
- **Geo Extensions**: PostGIS for location-based queries
- **LLM**: OpenAI API (primary: gpt-4o-mini for enrichment)

### Frontend
- **Framework**: Next.js 14+ with React 18+
- **State Management**: React Context + useState/useReducer
- **Styling**: Tailwind CSS 4
- **Maps**: MapLibre GL JS (free, open-source)
- **UI Components**: Custom components + Lucide React icons
- **Build Tool**: Built into Next.js

### Infrastructure
- **Hosting**: Vercel (seamless Next.js integration)
- **Database Hosting**: Supabase (managed Postgres with PostGIS)
- **CDN**: Vercel Edge Network (included)
- **Analytics**: PostHog (product analytics)
- **Monitoring**: Vercel Analytics + Supabase monitoring

## Data Pipeline

### External Sources
- **NOAA Database**: Seed hot springs with coordinates
- **swimmingholes.org**: Scrape swimming holes data
- **Tavily API**: Discovery and enrichment searches
- **OpenAI gpt-4o-mini**: Structured data extraction

### Pipeline Flow
```
NOAA + swimmingholes.org (seed ~3,000)
          ↓
Tavily discovery (find ~500 more)
          ↓
Tavily enrichment (snippets per spring)
          ↓
4o-mini extraction (raw text → structured JSON)
          ↓
Validation layer (enforce enums)
          ↓
Production database
```

## Development Tools

### Code Quality
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier with Tailwind plugin
- **Type Checking**: TypeScript 5 (strict mode)
- **Testing**: Playwright (e2e)

### Development Environment
- **Package Manager**: npm
- **Version Control**: Git
- **CI/CD**: Vercel automated deployments
- **Environment**: Local development with Next.js dev server

### Specialized Tools
- **Data Validation**: Zod for runtime type checking
- **Icons**: Lucide React
- **Product Analytics**: PostHog

## Architecture Decisions

### Database Design
- **PostgreSQL**: Relational structure for spring data
- **PostGIS Extension**: Geographic data types and spatial queries
  - `geography` type for accurate distance calculations
  - `ST_DWithin` for finding springs near location
  - `ST_Distance` for calculating distances
- **Enum Types**: Database-level enum constraints for controlled vocabulary
- **Normalized Schema**: Springs with related warnings array

### API Design
- **Next.js API Routes**: Server-side API endpoints
- **RESTful Design**: Simple GET endpoints for springs
- **Type Safety**: Shared TypeScript types
- **Input Validation**: Zod schemas for all inputs

### Security Considerations
- **Environment Variables**: All API keys in Vercel env vars
- **Input Validation**: Zod schemas for user inputs
- **Rate Limiting**: Vercel automatic limits

### Performance Considerations
- **ISR**: Incremental Static Regeneration on dynamic pages
- **Database Indexing**: Spatial indexes for PostGIS, text indexes for search
- **Image Optimization**: External URLs with Next.js image optimization

## Dependencies (Planned)

```json
{
  "next": "16.x",
  "react": "19.x",
  "typescript": "5",
  "tailwindcss": "4",
  "maplibre-gl": "5.x",
  "@supabase/supabase-js": "2.x",
  "openai": "6.x",
  "posthog-js": "1.x",
  "zod": "3.x",
  "lucide-react": "latest",
  "@playwright/test": "1.x"
}
```

## Environment Configuration

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LLM & Search (Required for enrichment)
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_key

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## LLM Model Reference

**Structured Extraction**: OpenAI gpt-4o-mini
- **Purpose**: Extract structured data from Tavily search results
- **Use Case**: Convert raw text snippets to structured JSON (temp, access, fees, etc.)
- **Cost**: ~$0.15/1M input tokens, ~$0.60/1M output tokens

**SEO Narratives**: OpenAI gpt-4.1-mini
- **Purpose**: Generate 150-200 word SEO descriptions
- **Use Case**: Engaging prose for spring detail pages
- **Cost**: ~$0.40/1M input tokens, ~$1.60/1M output tokens
- **Note**: Better prose quality than gpt-5-mini for narrative content

**Prompt Template**:
```
Extract structured data about this natural spring.

CRITICAL - Use ONLY these enum values:
- crowd_level: "empty" | "quiet" | "moderate" | "busy" | "packed"
- access_difficulty: "drive_up" | "short_walk" | "moderate_hike" | "difficult_hike"
- parking: "ample" | "limited" | "very_limited" | "roadside" | "trailhead"
- cell_service: "full" | "partial" | "none" | "unknown"
- fee_type: "free" | "paid" | "donation" | "unknown"
- spring_type: "hot" | "warm" | "cold"
- experience_type: "resort" | "primitive" | "hybrid"

Return JSON. Use null if unknown.
```

## Cost Summary

### One-Time (Enrichment for 3,070 springs)

| Component | First Run | Re-runs |
|-----------|-----------|---------|
| Tavily advanced search ($0.02/search) | ~$61 | $0 (cached) |
| gpt-4o-mini extraction | ~$0.60 | ~$0.60 |
| gpt-4.1-mini SEO narratives | ~$2 | ~$2 |
| **Total** | **~$64** | **~$3** |

### Ongoing (Monthly)
- Supabase: Free tier
- Vercel: Free tier
- MapLibre: $0 (open source)
- **Total: ~$0/month**
