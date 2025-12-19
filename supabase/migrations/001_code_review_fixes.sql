-- =============================================================================
-- Code Review Fixes Migration
-- Run this AFTER schema.sql has been applied
-- =============================================================================

-- =============================================================================
-- 1. Additional Indexes (Issues #6, #12)
-- =============================================================================

-- Index for featured springs query (confidence + photo_url)
CREATE INDEX IF NOT EXISTS idx_springs_confidence ON springs(confidence) WHERE confidence IS NOT NULL;

-- Partial index for featured springs (photo + high confidence)
CREATE INDEX IF NOT EXISTS idx_springs_featured ON springs(confidence, photo_url)
  WHERE photo_url IS NOT NULL AND confidence = 'high';

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_springs_state_type ON springs(state, spring_type);
CREATE INDEX IF NOT EXISTS idx_springs_state_experience ON springs(state, experience_type);

-- Index for text search on name
CREATE INDEX IF NOT EXISTS idx_springs_name_trgm ON springs USING gin(name gin_trgm_ops);

-- Enable trigram extension for fuzzy search (run only if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- 2. Foreign Key Constraint (Issue #13)
-- =============================================================================

-- Add foreign key to ensure state codes are valid
ALTER TABLE springs
  ADD CONSTRAINT fk_springs_state
  FOREIGN KEY (state) REFERENCES states(code)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- =============================================================================
-- 3. RLS Write Policies for Admin Operations (Issue #3)
-- =============================================================================

-- Service role can insert springs
CREATE POLICY "Service role insert springs" ON springs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role can update springs
CREATE POLICY "Service role update springs" ON springs
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role can delete springs
CREATE POLICY "Service role delete springs" ON springs
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Service role can modify states
CREATE POLICY "Service role update states" ON states
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- 4. Optimized State Counts Trigger (Issue #9)
-- =============================================================================

-- Drop the old trigger
DROP TRIGGER IF EXISTS springs_state_counts ON springs;
DROP FUNCTION IF EXISTS update_state_counts();

-- Create optimized function using incremental updates
CREATE OR REPLACE FUNCTION update_state_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    UPDATE states SET
      spring_count = spring_count + 1,
      hot_count = CASE WHEN NEW.spring_type = 'hot' THEN hot_count + 1 ELSE hot_count END,
      warm_count = CASE WHEN NEW.spring_type = 'warm' THEN warm_count + 1 ELSE warm_count END,
      cold_count = CASE WHEN NEW.spring_type = 'cold' THEN cold_count + 1 ELSE cold_count END
    WHERE code = NEW.state;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    UPDATE states SET
      spring_count = spring_count - 1,
      hot_count = CASE WHEN OLD.spring_type = 'hot' THEN hot_count - 1 ELSE hot_count END,
      warm_count = CASE WHEN OLD.spring_type = 'warm' THEN warm_count - 1 ELSE warm_count END,
      cold_count = CASE WHEN OLD.spring_type = 'cold' THEN cold_count - 1 ELSE cold_count END
    WHERE code = OLD.state;
    RETURN OLD;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If state changed, decrement old state and increment new state
    IF OLD.state != NEW.state THEN
      -- Decrement old state
      UPDATE states SET
        spring_count = spring_count - 1,
        hot_count = CASE WHEN OLD.spring_type = 'hot' THEN hot_count - 1 ELSE hot_count END,
        warm_count = CASE WHEN OLD.spring_type = 'warm' THEN warm_count - 1 ELSE warm_count END,
        cold_count = CASE WHEN OLD.spring_type = 'cold' THEN cold_count - 1 ELSE cold_count END
      WHERE code = OLD.state;

      -- Increment new state
      UPDATE states SET
        spring_count = spring_count + 1,
        hot_count = CASE WHEN NEW.spring_type = 'hot' THEN hot_count + 1 ELSE hot_count END,
        warm_count = CASE WHEN NEW.spring_type = 'warm' THEN warm_count + 1 ELSE warm_count END,
        cold_count = CASE WHEN NEW.spring_type = 'cold' THEN cold_count + 1 ELSE cold_count END
      WHERE code = NEW.state;
    -- If only spring_type changed (same state)
    ELSIF OLD.spring_type != NEW.spring_type THEN
      UPDATE states SET
        hot_count = hot_count
          - CASE WHEN OLD.spring_type = 'hot' THEN 1 ELSE 0 END
          + CASE WHEN NEW.spring_type = 'hot' THEN 1 ELSE 0 END,
        warm_count = warm_count
          - CASE WHEN OLD.spring_type = 'warm' THEN 1 ELSE 0 END
          + CASE WHEN NEW.spring_type = 'warm' THEN 1 ELSE 0 END,
        cold_count = cold_count
          - CASE WHEN OLD.spring_type = 'cold' THEN 1 ELSE 0 END
          + CASE WHEN NEW.spring_type = 'cold' THEN 1 ELSE 0 END
      WHERE code = NEW.state;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER springs_state_counts
  AFTER INSERT OR UPDATE OR DELETE ON springs
  FOR EACH ROW
  EXECUTE FUNCTION update_state_counts();

-- =============================================================================
-- 5. Verify Constraints
-- =============================================================================

-- Add check constraint to ensure counts don't go negative
ALTER TABLE states
  ADD CONSTRAINT check_counts_non_negative
  CHECK (spring_count >= 0 AND hot_count >= 0 AND warm_count >= 0 AND cold_count >= 0);
