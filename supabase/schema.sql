-- SoakMap Database Schema
-- Run this in Supabase SQL Editor or via psql

-- =============================================================================
-- 1. Enable PostGIS Extension
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- 2. Create Enum Types
-- =============================================================================

-- Spring classification
CREATE TYPE spring_type AS ENUM ('hot', 'warm', 'cold');
CREATE TYPE experience_type AS ENUM ('resort', 'primitive', 'hybrid');

-- Access & logistics
CREATE TYPE access_difficulty AS ENUM ('drive_up', 'short_walk', 'moderate_hike', 'difficult_hike');
CREATE TYPE parking_type AS ENUM ('ample', 'limited', 'very_limited', 'roadside', 'trailhead');
CREATE TYPE cell_service_type AS ENUM ('full', 'partial', 'none', 'unknown');
CREATE TYPE fee_type AS ENUM ('free', 'paid', 'donation', 'unknown');

-- Experience details
CREATE TYPE crowd_level AS ENUM ('empty', 'quiet', 'moderate', 'busy', 'packed');
CREATE TYPE best_season AS ENUM ('spring', 'summer', 'fall', 'winter', 'year_round');
CREATE TYPE best_time AS ENUM ('weekday', 'weekend', 'early_morning', 'evening', 'any');
CREATE TYPE clothing_optional_type AS ENUM ('yes', 'no', 'unofficial', 'unknown');
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

-- Warnings array values
CREATE TYPE warning_type AS ENUM (
  'strong_current', 'cold_shock', 'high_temperature', 'cliff_edges',
  'no_lifeguard', 'wildlife_bears', 'wildlife_snakes', 'remote_no_help',
  'seasonal_closure', 'flash_flood_risk', 'slippery_rocks'
);

-- =============================================================================
-- 3. Create Springs Table
-- =============================================================================

CREATE TABLE springs (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,

  -- Location
  state CHAR(2) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  lat DOUBLE PRECISION GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED,
  lng DOUBLE PRECISION GENERATED ALWAYS AS (ST_X(location::geometry)) STORED,

  -- Classification (required)
  spring_type spring_type NOT NULL,
  experience_type experience_type NOT NULL,
  description TEXT NOT NULL,

  -- Temperature
  temp_f INTEGER,

  -- Access & logistics (optional, enriched)
  access_difficulty access_difficulty,
  parking parking_type,
  time_from_parking_min INTEGER,
  cell_service cell_service_type,
  fee_type fee_type,
  fee_amount_usd DECIMAL(6,2),

  -- Experience details (optional, enriched)
  crowd_level crowd_level,
  best_season best_season,
  best_time best_time,
  clothing_optional clothing_optional_type,

  -- Hot spring specific
  sulfur_smell TEXT,
  pool_count INTEGER,

  -- Cold spring specific
  depth TEXT,
  water_clarity TEXT,
  cliff_jumping BOOLEAN,
  cliff_heights_ft INTEGER[],
  rope_swing BOOLEAN,
  waterfall BOOLEAN,
  kid_friendly TEXT,

  -- Warnings
  warnings warning_type[],

  -- Media
  photo_url TEXT,

  -- Pipeline tracking
  source TEXT,
  source_id TEXT,
  enrichment_status TEXT DEFAULT 'pending',
  confidence confidence_level,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. Create Indexes
-- =============================================================================

CREATE INDEX idx_springs_state ON springs(state);
CREATE INDEX idx_springs_type ON springs(spring_type);
CREATE INDEX idx_springs_experience ON springs(experience_type);
CREATE INDEX idx_springs_location ON springs USING GIST(location);
CREATE INDEX idx_springs_slug ON springs(slug);

-- =============================================================================
-- 5. Create States Table
-- =============================================================================

CREATE TABLE states (
  code CHAR(2) PRIMARY KEY,
  name TEXT NOT NULL,
  spring_count INTEGER DEFAULT 0,
  hot_count INTEGER DEFAULT 0,
  warm_count INTEGER DEFAULT 0,
  cold_count INTEGER DEFAULT 0
);

-- Insert all 50 states
INSERT INTO states (code, name) VALUES
  ('AL', 'Alabama'), ('AK', 'Alaska'), ('AZ', 'Arizona'), ('AR', 'Arkansas'),
  ('CA', 'California'), ('CO', 'Colorado'), ('CT', 'Connecticut'), ('DE', 'Delaware'),
  ('FL', 'Florida'), ('GA', 'Georgia'), ('HI', 'Hawaii'), ('ID', 'Idaho'),
  ('IL', 'Illinois'), ('IN', 'Indiana'), ('IA', 'Iowa'), ('KS', 'Kansas'),
  ('KY', 'Kentucky'), ('LA', 'Louisiana'), ('ME', 'Maine'), ('MD', 'Maryland'),
  ('MA', 'Massachusetts'), ('MI', 'Michigan'), ('MN', 'Minnesota'), ('MS', 'Mississippi'),
  ('MO', 'Missouri'), ('MT', 'Montana'), ('NE', 'Nebraska'), ('NV', 'Nevada'),
  ('NH', 'New Hampshire'), ('NJ', 'New Jersey'), ('NM', 'New Mexico'), ('NY', 'New York'),
  ('NC', 'North Carolina'), ('ND', 'North Dakota'), ('OH', 'Ohio'), ('OK', 'Oklahoma'),
  ('OR', 'Oregon'), ('PA', 'Pennsylvania'), ('RI', 'Rhode Island'), ('SC', 'South Carolina'),
  ('SD', 'South Dakota'), ('TN', 'Tennessee'), ('TX', 'Texas'), ('UT', 'Utah'),
  ('VT', 'Vermont'), ('VA', 'Virginia'), ('WA', 'Washington'), ('WV', 'West Virginia'),
  ('WI', 'Wisconsin'), ('WY', 'Wyoming');

-- =============================================================================
-- 6. Enable Row Level Security
-- =============================================================================

ALTER TABLE springs ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read springs" ON springs FOR SELECT USING (true);
CREATE POLICY "Public read states" ON states FOR SELECT USING (true);

-- =============================================================================
-- 7. Database Functions
-- =============================================================================

-- Find nearby springs using PostGIS
CREATE OR REPLACE FUNCTION nearby_springs(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_miles INTEGER DEFAULT 50,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  state CHAR(2),
  spring_type spring_type,
  experience_type experience_type,
  distance_miles DOUBLE PRECISION
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    s.id, s.name, s.slug, s.state, s.spring_type, s.experience_type,
    ST_Distance(s.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) / 1609.34 AS distance_miles
  FROM springs s
  WHERE ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_miles * 1609.34)
  ORDER BY distance_miles
  LIMIT max_results;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER springs_updated_at
  BEFORE UPDATE ON springs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 8. Update state counts trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_state_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts for affected states
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE states SET
      spring_count = (SELECT COUNT(*) FROM springs WHERE state = NEW.state),
      hot_count = (SELECT COUNT(*) FROM springs WHERE state = NEW.state AND spring_type = 'hot'),
      warm_count = (SELECT COUNT(*) FROM springs WHERE state = NEW.state AND spring_type = 'warm'),
      cold_count = (SELECT COUNT(*) FROM springs WHERE state = NEW.state AND spring_type = 'cold')
    WHERE code = NEW.state;
  END IF;

  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.state != NEW.state) THEN
    UPDATE states SET
      spring_count = (SELECT COUNT(*) FROM springs WHERE state = OLD.state),
      hot_count = (SELECT COUNT(*) FROM springs WHERE state = OLD.state AND spring_type = 'hot'),
      warm_count = (SELECT COUNT(*) FROM springs WHERE state = OLD.state AND spring_type = 'warm'),
      cold_count = (SELECT COUNT(*) FROM springs WHERE state = OLD.state AND spring_type = 'cold')
    WHERE code = OLD.state;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER springs_state_counts
  AFTER INSERT OR UPDATE OR DELETE ON springs
  FOR EACH ROW
  EXECUTE FUNCTION update_state_counts();
