---
Last-Updated: 2025-12-22
Maintainer: RB
Status: Documented
---

# Data Pipeline: SoakMap

## Overview

```
Data Sources (8 scrapers)
         ↓
Supabase (raw springs)
         ↓
Tavily enrichment (web snippets)
         ↓
gpt-4o-mini extraction (structured JSON)
         ↓
Validation + deduplication
         ↓
gpt-4.1-mini SEO narratives
         ↓
Wikimedia Commons photos
         ↓
Production database (2,956 springs)
```

---

## Scripts

All scripts in `/scripts/`, run with `npx tsx scripts/[name].ts`.

### Data Acquisition (01-10)

| Script | Source | Count | Notes |
|--------|--------|-------|-------|
| `01-import-gnis.ts` | USGS GNIS | 550 | Downloads per-state files, filters for hot/warm springs |
| `02-scrape-swimmingholes.ts` | swimmingholes.org | 1,116 | Parses HTML tables, handles sub-places |
| `03-scrape-idaho.ts` | idahohotsprings.com | 9 | Regional scraper |
| `06-scrape-soakoregon.ts` | soakoregon.com | 32 | Oregon-focused |
| `07-import-pangaea.ts` | PANGAEA NOAA | 1,065 | Scientific dataset (1980s) |
| `08-scrape-wikipedia.ts` | Wikipedia | 48 | List + individual article fetching |
| `09-scrape-hotspringslocator.ts` | hotspringslocator.com | 53 | 6 western states, GPS + chemistry |
| `10-scrape-tophotsprings.ts` | tophotsprings.com | 197 | 24 US states |

### Enrichment (04, 11-12)

| Script | Purpose | Model |
|--------|---------|-------|
| `04-enrich-springs.ts` | Structured data extraction | Tavily + gpt-4o-mini |
| `11-generate-seo-narratives.ts` | SEO descriptions | gpt-4.1-mini |
| `12-fetch-photos.ts` | Wikimedia Commons photos | - |

### Validation (05)

| Script | Purpose |
|--------|---------|
| `05-validate-data.ts` | Zod validation, dedup, state counts |

### SEO (submit-indexnow)

| Script | Purpose |
|--------|---------|
| `submit-indexnow.ts` | Submit URLs to Bing, Yandex, etc. |

---

## Shared Utilities

All in `/scripts/lib/`:

| File | Purpose |
|------|---------|
| `config.ts` | Environment validation, API keys, rate limits |
| `logger.ts` | Colored console output, progress bars |
| `validation.ts` | Zod schemas for enums, `validateSprings()` |
| `utils.ts` | `slugify()`, `retry()`, `sleep()`, `chunk()` |
| `dedup.ts` | `normalizeName()`, `areLikelyDuplicates()`, `findDuplicateGroups()` |
| `supabase.ts` | Service role client, types |

---

## Enrichment Workflow

### Step 1: Structured Data (`04-enrich-springs.ts`)

1. Fetch springs with `enrichment_status = 'pending'`
2. For each spring, query Tavily API (advanced search)
3. Pass snippets to gpt-4o-mini for extraction:
   - `temp_f`, `access_difficulty`, `parking`
   - `fee_type`, `crowd_level`, `clothing_optional`
   - `experience_type`, `confidence`
4. Validate against Zod schema
5. Update spring record, set `enrichment_status = 'enriched'`

```bash
npx tsx scripts/04-enrich-springs.ts --limit 50
npx tsx scripts/04-enrich-springs.ts --dry-run --limit 10
```

### Step 2: SEO Narratives (`11-generate-seo-narratives.ts`)

1. Fetch springs with `seo_description IS NULL`
2. Generate 150-200 word markdown description via gpt-4.1-mini
3. Headers: About, Getting There, What to Expect, Tips
4. Update `seo_description` field

```bash
npx tsx scripts/11-generate-seo-narratives.ts --limit 100
```

### Step 3: Photos (`12-fetch-photos.ts`)

1. Fetch springs with `photo_url IS NULL`
2. Query Wikimedia Commons API by name + state
3. Filter: skip maps, logos, SVGs, small images
4. Update `photo_url` with best match

```bash
npx tsx scripts/12-fetch-photos.ts
```

---

## Validation

The `05-validate-data.ts` script:

1. Fetches all springs (paginated, 1000/batch)
2. Validates against Zod schema (enforces enums)
3. Reports invalid values with suggestions
4. `--fix` flag: auto-corrects fixable issues
5. `--fix-duplicates` flag: merges detected duplicates
6. Updates state counts table

```bash
npx tsx scripts/05-validate-data.ts
npx tsx scripts/05-validate-data.ts --fix
npx tsx scripts/05-validate-data.ts --fix-duplicates
```

---

## Deduplication

Built into `/scripts/lib/dedup.ts`:

- **Pre-insert:** Scrapers check existing DB before insert
- **Post-import:** `--fix-duplicates` merges duplicates
- **Matching:** Same normalized name + state, OR proximity (<500m) + similar name
- **Merge:** Keeps record with most populated fields

---

## Rate Limits & Concurrency

| Service | Delay | Concurrency |
|---------|-------|-------------|
| Tavily | 200ms | 1 |
| OpenAI | 100ms | 50 |
| GNIS download | 500ms | 1 |
| Web scrapers | 500ms | 1 |

---

## Costs

| Operation | Cost |
|-----------|------|
| Tavily advanced search | $0.02/query |
| gpt-4o-mini extraction | ~$0.002/spring |
| gpt-4.1-mini narratives | ~$0.0006/spring |

**Full enrichment (2,931 springs):** ~$67

---

## Common Commands

```bash
# Full pipeline
npx tsx scripts/run-pipeline.ts all

# Individual stages
npx tsx scripts/run-pipeline.ts gnis swimmingholes enrich validate

# Enrichment with limit
npx tsx scripts/04-enrich-springs.ts --limit 50

# Dry run (no DB changes)
npx tsx scripts/04-enrich-springs.ts --dry-run --limit 10

# Validate and fix
npx tsx scripts/05-validate-data.ts --fix

# Generate SEO content
npx tsx scripts/11-generate-seo-narratives.ts --limit 100

# Fetch photos
npx tsx scripts/12-fetch-photos.ts

# Submit to search engines
npx tsx scripts/submit-indexnow.ts
```
