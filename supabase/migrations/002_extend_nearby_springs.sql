-- Extend nearby_springs function to return fields needed for SpringCard and SpringMap
-- Includes: lat, lng, photo_url, temp_f, access_difficulty, parking, fee_type
-- NOTE: Input params renamed to search_lat/search_lng to avoid collision with output columns

-- Drop existing function first (return type is changing)
DROP FUNCTION IF EXISTS nearby_springs(double precision, double precision, integer, integer);

CREATE OR REPLACE FUNCTION nearby_springs(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
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
  photo_url TEXT,
  temp_f INTEGER,
  access_difficulty access_difficulty,
  parking parking_type,
  fee_type fee_type
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    s.id, s.name, s.slug, s.state, s.spring_type, s.experience_type,
    ST_Distance(s.location, ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography) / 1609.34 AS distance_miles,
    s.lat, s.lng, s.photo_url,
    s.temp_f, s.access_difficulty, s.parking, s.fee_type
  FROM springs s
  WHERE ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography, radius_miles * 1609.34)
  ORDER BY distance_miles
  LIMIT max_results;
$$;
