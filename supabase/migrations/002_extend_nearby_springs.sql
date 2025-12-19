-- Extend nearby_springs function to return fields needed for SpringCard and SpringMap
-- Run this in Supabase SQL Editor

-- Drop existing function first (return type is changing)
DROP FUNCTION IF EXISTS nearby_springs(double precision, double precision, integer, integer);

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
  distance_miles DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_url TEXT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    s.id, s.name, s.slug, s.state, s.spring_type, s.experience_type,
    ST_Distance(s.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) / 1609.34 AS distance_miles,
    s.lat, s.lng, s.photo_url
  FROM springs s
  WHERE ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_miles * 1609.34)
  ORDER BY distance_miles
  LIMIT max_results;
$$;
