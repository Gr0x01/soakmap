---
Last-Updated: 2025-12-19
Maintainer: RB
Status: Defined
---

# Project Brief: SoakMap - Natural Springs Directory

## Project Overview

**Goal:** Beat findaspring.com and swimmingholes.org with better UX + classification

**Build Time:** 4 days

**Launch Target:** 1,000 springs

---

## Core Value Proposition

> "Find the right natural spring for YOUR trip - resort soak or primitive swimming hole."

**The gap:** Competitors dump locations with no classification. We help users filter by experience type, season, and practical logistics.

---

## MVP Features (Launch)

### Temperature-Based Discovery

| Type | Definition | Season |
|------|------------|--------|
| **Hot** | 100°F+ | Winter soaking |
| **Warm** | 70-99°F | Year-round |
| **Cold** | <70°F | Summer swimming |

### Experience Classification

| Type | Definition | Example |
|------|------------|---------|
| **Resort** | Developed, fees, amenities | Glenwood Hot Springs, CO |
| **Primitive** | Natural, free, may require hike | Goldbug Hot Springs, ID |
| **Hybrid** | Light development, natural character | Travertine Hot Springs, CA |

### Pages Required

| Page Type | Count | Purpose |
|-----------|-------|---------|
| Homepage | 1 | Search + filters + featured |
| State pages | 50 | SEO + browsing |
| Spring detail | 1,000 | Individual listings |
| Activity pairing | 10-15 | "Near [city]" SEO pages |

### Filters (Must Work at Launch)

- Temperature type (hot/warm/cold)
- Experience type (resort/primitive/hybrid)
- State
- Search by name

---

## Data Acquisition

### The Stack

| Tool | Purpose |
|------|---------|
| **NOAA Database** | Seed 1,661 hot springs with coords |
| **swimmingholes.org** | Scrape 1,400 swimming holes |
| **Tavily** | Discover new springs + enrich existing |
| **4o-mini** | Extract structured data from raw text |

### Pipeline

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
Manual QA (top 100)
          ↓
Production database (1,000 launch, 3,500 full)
```

### Tavily Usage

**Discovery queries:**
- "best swimming holes [State]"
- "secret hot springs [State]"
- "natural springs near [City]"

**Enrichment queries:**
- "[Spring Name] [State]" for each spring
- Collect snippets about fees, parking, access, crowds

### 4o-mini Extraction

Feed raw text, get structured JSON:

**Input:** "Goldbug requires a 2-mile hike. No fee, clothing optional, crowded weekends. About 105°F."

**Output:**
```json
{
  "experience_type": "primitive",
  "fee_type": "free",
  "access_difficulty": "moderate_hike",
  "clothing_optional": "yes",
  "crowd_level": "busy",
  "temp_f": 105,
  "confidence": "high"
}
```

---

## Data Schema

### Controlled Vocabulary (Enums)

Strict values enforced in prompt, validation, and database:

**spring_type:** `hot` | `warm` | `cold`

**experience_type:** `resort` | `primitive` | `hybrid`

**access_difficulty:**
| Value | Definition |
|-------|------------|
| `drive_up` | Park and you're there |
| `short_walk` | 2-15 min, easy |
| `moderate_hike` | 15-60 min, some effort |
| `difficult_hike` | 60+ min, strenuous |

**parking:** `ample` | `limited` | `very_limited` | `roadside` | `trailhead`

**cell_service:** `full` | `partial` | `none` | `unknown`

**fee_type:** `free` | `paid` | `donation` | `unknown`

**crowd_level:**
| Value | Definition |
|-------|------------|
| `empty` | Often have it to yourself |
| `quiet` | Few other visitors |
| `moderate` | Expect others |
| `busy` | Popular, sharing space |
| `packed` | Very crowded, may wait |

**best_season:** `spring` | `summer` | `fall` | `winter` | `year_round`

**best_time:** `weekday` | `weekend` | `early_morning` | `evening` | `any`

**sulfur_smell:** `none` | `faint` | `moderate` | `strong`

**clothing_optional:** `yes` | `no` | `unofficial` | `unknown`

**depth:** `shallow` | `medium` | `deep` | `varies`

**water_clarity:** `crystal` | `clear` | `murky` | `varies`

**kid_friendly:** `yes` | `some_areas` | `no` | `unknown`

**confidence:** `high` | `medium` | `low`

### Core Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | ✅ | Display name |
| slug | string | ✅ | URL-safe |
| state | string(2) | ✅ | Two-letter code |
| lat | float | ✅ | Decimal degrees |
| long | float | ✅ | Decimal degrees |
| spring_type | enum | ✅ | hot/warm/cold |
| experience_type | enum | ✅ | resort/primitive/hybrid |
| description | text | ✅ | 2-3 sentences |
| temp_f | int | - | Actual if known |
| photo_url | string | - | External URL |

### Phase 2 Fields

| Field | Type | Notes |
|-------|------|-------|
| access_difficulty | enum | How hard to reach |
| parking | enum | Parking situation |
| time_from_parking_min | int | Walk time |
| cell_service | enum | Safety info |
| fee_type | enum | Free/paid |
| fee_amount_usd | float | If paid |
| crowd_level | enum | How busy |
| best_season | enum | When to go |
| best_time | enum | Day/time |

### Hot Springs Fields

| Field | Type | Notes |
|-------|------|-------|
| sulfur_smell | enum | Smell strength |
| clothing_optional | enum | Dress code |
| pool_count | int | Number of pools |

### Cold Springs Fields

| Field | Type | Notes |
|-------|------|-------|
| depth | enum | Water depth |
| water_clarity | enum | Visibility |
| cliff_jumping | bool | Has cliffs |
| cliff_heights_ft | int[] | Jump heights |
| rope_swing | bool | Has rope swing |
| waterfall | bool | Has waterfall |
| kid_friendly | enum | Safe for kids |

### Warnings (Array)

Allowed values:
- `strong_current`
- `cold_shock`
- `high_temperature`
- `cliff_edges`
- `no_lifeguard`
- `wildlife_bears`
- `wildlife_snakes`
- `remote_no_help`
- `seasonal_closure`
- `flash_flood_risk`
- `slippery_rocks`

---

## 4o-mini Prompt

```
Extract structured data about this natural spring.

CRITICAL - Use ONLY these enum values:
- crowd_level: "empty" | "quiet" | "moderate" | "busy" | "packed"
  (NOT "crowded", "light", "heavy")
- access_difficulty: "drive_up" | "short_walk" | "moderate_hike" | "difficult_hike"
- parking: "ample" | "limited" | "very_limited" | "roadside" | "trailhead"
- cell_service: "full" | "partial" | "none" | "unknown"
- fee_type: "free" | "paid" | "donation" | "unknown"
- spring_type: "hot" | "warm" | "cold"
- experience_type: "resort" | "primitive" | "hybrid"

Return JSON. Use null if unknown.

TEXT:
"""
{input_text}
"""
```

---

## Validation Layer

After 4o-mini returns JSON:

1. **Check enums** - Reject invalid values
2. **Auto-fix common mistakes** - "crowded" → "busy"
3. **Flag low confidence** - Queue for manual review
4. **Require coordinates** - No coords = no publish

---

## Day 1 Data Targets

- [ ] NOAA data imported (~1,661)
- [ ] swimmingholes.org scraped (~1,400)
- [ ] Tavily discovery run (10 states)
- [ ] 4o-mini extraction on 500 springs
- [ ] Top 100 manually QA'd
- [ ] 500-1,000 production-ready

---

## UX Requirements

### Homepage
- Search bar (prominent)
- Temperature filter toggle
- Experience filter toggle
- State selector
- Featured springs (seasonal rotation)

### State Pages
- Spring count
- Filter toggles
- Grid/list of springs showing: name, badges, location

### Detail Pages
- Name (H1)
- Location + coordinates
- Badges (temp, experience)
- "Get Directions" button
- Description
- Photo (if available)
- Nearby springs

---

## SEO Requirements

- Unique title tags
- Meta descriptions with location + type
- Structured data (LocalBusiness schema)
- XML sitemap
- Mobile-responsive
- <3s load time

---

## Success Metrics

| Milestone | Target |
|-----------|--------|
| Month 1 | 500+ springs, 50 state pages indexed, first traffic |
| Month 3 | 10k sessions, 1,500 springs, first-page rankings |
| Month 6 | 30-50k sessions, Mediavine application |
| Month 12 | 75-100k sessions, $1,500-2,500/mo revenue |

---

## Not Building

- ❌ User accounts
- ❌ Reviews/ratings
- ❌ Booking
- ❌ Mobile app
- ❌ International
- ❌ Man-made spas
