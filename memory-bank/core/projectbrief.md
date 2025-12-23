---
Last-Updated: 2025-12-22
Maintainer: RB
Status: Launched
---

# Project Brief: SoakMap

## Overview

**Goal:** Beat findaspring.com and swimmingholes.org with better UX + classification

**Core Value:**
> "Find the right natural spring for YOUR trip - resort soak or primitive swimming hole."

**The gap:** Competitors dump locations with no classification. We help users filter by experience type, season, and practical logistics.

---

## Features

### Temperature Classification

| Type | Definition | Use Case |
|------|------------|----------|
| **Hot** | 100°F+ | Winter soaking |
| **Warm** | 70-99°F | Year-round |
| **Cold** | <70°F | Summer swimming |

### Experience Types

| Type | Definition | Example |
|------|------------|---------|
| **Resort** | Developed, fees, amenities | Glenwood Hot Springs, CO |
| **Primitive** | Natural, free, may require hike | Goldbug Hot Springs, ID |
| **Hybrid** | Light development, natural character | Travertine Hot Springs, CA |

---

## Data Schema

### Controlled Vocabulary (Enums)

All enforced at database level:

**spring_type:** `hot` | `warm` | `cold`

**experience_type:** `resort` | `primitive` | `hybrid`

**access_difficulty:**
- `drive_up` - Park and you're there
- `short_walk` - 2-15 min, easy
- `moderate_hike` - 15-60 min, some effort
- `difficult_hike` - 60+ min, strenuous

**parking:** `ample` | `limited` | `very_limited` | `roadside` | `trailhead`

**cell_service:** `full` | `partial` | `none` | `unknown`

**fee_type:** `free` | `paid` | `donation` | `unknown`

**crowd_level:**
- `empty` - Often have it to yourself
- `quiet` - Few other visitors
- `moderate` - Expect others
- `busy` - Popular, sharing space
- `packed` - Very crowded, may wait

**best_season:** `spring` | `summer` | `fall` | `winter` | `year_round`

**clothing_optional:** `yes` | `no` | `unofficial` | `unknown`

**confidence:** `high` | `medium` | `low`

### Core Fields

| Field | Type | Required |
|-------|------|----------|
| name | string | Yes |
| slug | string | Yes |
| state | string(2) | Yes |
| lat/long | float | Yes |
| spring_type | enum | Yes |
| experience_type | enum | Yes |
| description | text | Yes |
| temp_f | int | No |
| photo_url | string | No |

### Warnings (Array)

Allowed values: `strong_current`, `cold_shock`, `high_temperature`, `cliff_edges`, `no_lifeguard`, `wildlife_bears`, `wildlife_snakes`, `remote_no_help`, `seasonal_closure`, `flash_flood_risk`, `slippery_rocks`

---

## UX Requirements

### Homepage
- Search bar (prominent)
- Temperature filter toggle
- Experience filter toggle
- State selector
- Featured springs

### State Pages
- Spring count by type
- Filter toggles
- Grid of springs with badges

### Detail Pages
- Name, location, coordinates
- Temperature + experience badges
- "Get Directions" button
- Description + warnings
- Photo (if available)
- Nearby springs

---

## SEO Requirements

- Unique title tags per page
- Meta descriptions with location + type
- JSON-LD structured data (Place, FAQPage)
- XML sitemap with lastmod dates
- Mobile-responsive
- <3s load time

---

## Success Metrics

| Milestone | Target |
|-----------|--------|
| Month 1 | 50 state pages indexed, first traffic |
| Month 3 | 10k sessions, first-page rankings |
| Month 6 | 30-50k sessions, Mediavine eligible |
| Month 12 | 75-100k sessions, $1,500-2,500/mo |

---

## Not Building

- User accounts
- Reviews/ratings
- Booking integration
- Mobile app
- International coverage
- Man-made spas
