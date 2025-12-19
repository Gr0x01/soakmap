#!/usr/bin/env npx tsx
/**
 * Validate and clean spring data
 *
 * Usage:
 *   npx tsx scripts/05-validate-data.ts [--fix] [--delete-invalid]
 *
 * The script:
 * 1. Fetches all springs from database
 * 2. Validates against Zod schema
 * 3. Reports issues (or fixes them with --fix)
 * 4. Identifies and reports duplicates
 * 5. Updates state counts
 */

import { supabase } from './lib/supabase';
import { createLogger } from './lib/logger';
import {
  springTypeEnum,
  experienceTypeEnum,
  accessDifficultyEnum,
  parkingTypeEnum,
  cellServiceEnum,
  feeTypeEnum,
  crowdLevelEnum,
  bestSeasonEnum,
  clothingOptionalEnum,
  confidenceEnum,
  stateCodeEnum,
} from './lib/validation';
import { slugify } from './lib/utils';

const log = createLogger('Validate');

interface ValidationIssue {
  id: string;
  name: string;
  field: string;
  issue: string;
  currentValue: unknown;
  suggestedFix?: unknown;
}

interface DuplicateGroup {
  name: string;
  ids: string[];
  states: string[];
}

async function fetchAllSprings() {
  const allSprings = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('springs')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at');

    if (error) {
      throw new Error(`Failed to fetch springs: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    allSprings.push(...data);
    offset += limit;

    if (data.length < limit) break;
  }

  return allSprings;
}

function validateSpring(spring: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = spring.id as string;
  const name = spring.name as string;

  // Required fields
  if (!spring.name || typeof spring.name !== 'string' || spring.name.length < 2) {
    issues.push({
      id,
      name,
      field: 'name',
      issue: 'Name is required and must be at least 2 characters',
      currentValue: spring.name,
    });
  }

  if (!spring.slug || typeof spring.slug !== 'string') {
    issues.push({
      id,
      name,
      field: 'slug',
      issue: 'Slug is required',
      currentValue: spring.slug,
      suggestedFix: spring.name && spring.state ? slugify(spring.name as string, spring.state as string) : undefined,
    });
  }

  // State validation
  const stateResult = stateCodeEnum.safeParse(spring.state);
  if (!stateResult.success) {
    issues.push({
      id,
      name,
      field: 'state',
      issue: 'Invalid state code',
      currentValue: spring.state,
    });
  }

  // Coordinate validation
  const lat = spring.lat as number;
  const lng = spring.lng as number;

  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    issues.push({
      id,
      name,
      field: 'lat',
      issue: 'Latitude must be between -90 and 90',
      currentValue: lat,
    });
  }

  if (typeof lng !== 'number' || lng < -180 || lng > 180) {
    issues.push({
      id,
      name,
      field: 'lng',
      issue: 'Longitude must be between -180 and 180',
      currentValue: lng,
    });
  }

  // Check coordinates are in US bounds (rough check)
  if (lat && lng) {
    const inUS =
      (lat >= 24 && lat <= 49 && lng >= -125 && lng <= -66) || // Continental US
      (lat >= 18 && lat <= 22 && lng >= -161 && lng <= -154) || // Hawaii
      (lat >= 51 && lat <= 72 && lng >= -180 && lng <= -130) || // Alaska mainland
      (lat >= 51 && lat <= 55 && lng >= 170 && lng <= 180); // Alaska Aleutians (cross dateline)

    if (!inUS) {
      issues.push({
        id,
        name,
        field: 'coordinates',
        issue: 'Coordinates appear to be outside US bounds',
        currentValue: { lat, lng },
      });
    }
  }

  // Enum validations
  const springTypeResult = springTypeEnum.safeParse(spring.spring_type);
  if (!springTypeResult.success) {
    issues.push({
      id,
      name,
      field: 'spring_type',
      issue: 'Invalid spring_type enum',
      currentValue: spring.spring_type,
    });
  }

  const expTypeResult = experienceTypeEnum.safeParse(spring.experience_type);
  if (!expTypeResult.success) {
    issues.push({
      id,
      name,
      field: 'experience_type',
      issue: 'Invalid experience_type enum',
      currentValue: spring.experience_type,
    });
  }

  // Optional enum validations
  if (spring.access_difficulty !== null) {
    const result = accessDifficultyEnum.safeParse(spring.access_difficulty);
    if (!result.success) {
      issues.push({
        id,
        name,
        field: 'access_difficulty',
        issue: 'Invalid access_difficulty enum',
        currentValue: spring.access_difficulty,
        suggestedFix: null,
      });
    }
  }

  if (spring.parking !== null) {
    const result = parkingTypeEnum.safeParse(spring.parking);
    if (!result.success) {
      issues.push({
        id,
        name,
        field: 'parking',
        issue: 'Invalid parking enum',
        currentValue: spring.parking,
        suggestedFix: null,
      });
    }
  }

  if (spring.cell_service !== null) {
    const result = cellServiceEnum.safeParse(spring.cell_service);
    if (!result.success) {
      issues.push({
        id,
        name,
        field: 'cell_service',
        issue: 'Invalid cell_service enum',
        currentValue: spring.cell_service,
        suggestedFix: null,
      });
    }
  }

  if (spring.fee_type !== null) {
    const result = feeTypeEnum.safeParse(spring.fee_type);
    if (!result.success) {
      issues.push({
        id,
        name,
        field: 'fee_type',
        issue: 'Invalid fee_type enum',
        currentValue: spring.fee_type,
        suggestedFix: null,
      });
    }
  }

  if (spring.crowd_level !== null) {
    const result = crowdLevelEnum.safeParse(spring.crowd_level);
    if (!result.success) {
      issues.push({
        id,
        name,
        field: 'crowd_level',
        issue: 'Invalid crowd_level enum',
        currentValue: spring.crowd_level,
        suggestedFix: null,
      });
    }
  }

  if (spring.best_season !== null) {
    const result = bestSeasonEnum.safeParse(spring.best_season);
    if (!result.success) {
      issues.push({
        id,
        name,
        field: 'best_season',
        issue: 'Invalid best_season enum',
        currentValue: spring.best_season,
        suggestedFix: null,
      });
    }
  }

  if (spring.clothing_optional !== null) {
    const result = clothingOptionalEnum.safeParse(spring.clothing_optional);
    if (!result.success) {
      issues.push({
        id,
        name,
        field: 'clothing_optional',
        issue: 'Invalid clothing_optional enum',
        currentValue: spring.clothing_optional,
        suggestedFix: null,
      });
    }
  }

  if (spring.confidence !== null) {
    const result = confidenceEnum.safeParse(spring.confidence);
    if (!result.success) {
      issues.push({
        id,
        name,
        field: 'confidence',
        issue: 'Invalid confidence enum',
        currentValue: spring.confidence,
        suggestedFix: null,
      });
    }
  }

  // Numeric range validations
  const tempF = spring.temp_f as number | null;
  if (tempF !== null && (tempF < 32 || tempF > 212)) {
    issues.push({
      id,
      name,
      field: 'temp_f',
      issue: 'Temperature must be between 32 and 212 F',
      currentValue: tempF,
      suggestedFix: null,
    });
  }

  const timeFromParking = spring.time_from_parking_min as number | null;
  if (timeFromParking !== null && (timeFromParking < 0 || timeFromParking > 480)) {
    issues.push({
      id,
      name,
      field: 'time_from_parking_min',
      issue: 'Time from parking must be between 0 and 480 minutes',
      currentValue: timeFromParking,
      suggestedFix: null,
    });
  }

  const feeAmount = spring.fee_amount_usd as number | null;
  if (feeAmount !== null && (feeAmount < 0 || feeAmount > 500)) {
    issues.push({
      id,
      name,
      field: 'fee_amount_usd',
      issue: 'Fee amount must be between 0 and 500 USD',
      currentValue: feeAmount,
      suggestedFix: null,
    });
  }

  // Description validation
  const description = spring.description as string;
  if (!description || description.length < 10) {
    issues.push({
      id,
      name,
      field: 'description',
      issue: 'Description should be at least 10 characters',
      currentValue: description?.length || 0,
    });
  }

  return issues;
}

function findDuplicates(springs: Record<string, unknown>[]): DuplicateGroup[] {
  // Group by normalized name
  const byName = new Map<string, Record<string, unknown>[]>();

  for (const spring of springs) {
    const name = (spring.name as string).toLowerCase().trim();
    if (!byName.has(name)) {
      byName.set(name, []);
    }
    byName.get(name)!.push(spring);
  }

  // Find groups with multiple entries (same name)
  const duplicates: DuplicateGroup[] = [];

  for (const [name, group] of byName) {
    if (group.length > 1) {
      duplicates.push({
        name,
        ids: group.map((s) => s.id as string),
        states: group.map((s) => s.state as string),
      });
    }
  }

  // Grid-based proximity detection (O(n) instead of O(n²))
  // Group springs into grid cells of ~1km (0.01 degrees)
  const GRID_SIZE = 0.01; // ~1km
  const grid = new Map<string, Record<string, unknown>[]>();

  for (const spring of springs) {
    const lat = spring.lat as number;
    const lng = spring.lng as number;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;

    const cellKey = `${Math.floor(lat / GRID_SIZE)},${Math.floor(lng / GRID_SIZE)}`;
    if (!grid.has(cellKey)) {
      grid.set(cellKey, []);
    }
    grid.get(cellKey)!.push(spring);
  }

  // Find duplicates within same or adjacent cells
  const coordDupes: DuplicateGroup[] = [];
  const processedIds = new Set<string>();

  for (const [cellKey, cellSprings] of grid) {
    if (cellSprings.length <= 1) continue;

    // Check all springs in this cell against each other
    for (let i = 0; i < cellSprings.length; i++) {
      const a = cellSprings[i];
      const aId = a.id as string;
      if (processedIds.has(aId)) continue;

      const nearbyGroup: string[] = [aId];
      const nearbyStates: string[] = [a.state as string];
      const nearbyNames: string[] = [a.name as string];

      for (let j = i + 1; j < cellSprings.length; j++) {
        const b = cellSprings[j];
        const bId = b.id as string;
        if (processedIds.has(bId)) continue;

        const latDiff = Math.abs((a.lat as number) - (b.lat as number));
        const lngDiff = Math.abs((a.lng as number) - (b.lng as number));

        if (latDiff < GRID_SIZE && lngDiff < GRID_SIZE) {
          nearbyGroup.push(bId);
          nearbyStates.push(b.state as string);
          nearbyNames.push(b.name as string);
          processedIds.add(bId);
        }
      }

      if (nearbyGroup.length > 1) {
        processedIds.add(aId);
        coordDupes.push({
          name: `Near: ${nearbyNames.slice(0, 2).join(', ')}${nearbyNames.length > 2 ? '...' : ''}`,
          ids: nearbyGroup,
          states: nearbyStates,
        });
      }
    }
  }

  return [...duplicates, ...coordDupes];
}

async function updateStateCounts() {
  log.info('Updating state counts...');

  // Get counts by state and type
  const { data, error } = await supabase
    .from('springs')
    .select('state, spring_type');

  if (error) {
    throw new Error(`Failed to fetch springs: ${error.message}`);
  }

  // Aggregate counts
  const counts = new Map<string, { total: number; hot: number; warm: number; cold: number }>();

  for (const spring of data || []) {
    const state = spring.state;
    if (!counts.has(state)) {
      counts.set(state, { total: 0, hot: 0, warm: 0, cold: 0 });
    }
    const c = counts.get(state)!;
    c.total++;
    if (spring.spring_type === 'hot') c.hot++;
    if (spring.spring_type === 'warm') c.warm++;
    if (spring.spring_type === 'cold') c.cold++;
  }

  // Update states table
  for (const [code, c] of counts) {
    const { error: updateError } = await supabase
      .from('states')
      .update({
        spring_count: c.total,
        hot_count: c.hot,
        warm_count: c.warm,
        cold_count: c.cold,
      })
      .eq('code', code);

    if (updateError) {
      log.error(`Failed to update ${code}: ${updateError.message}`);
    }
  }

  log.success(`Updated counts for ${counts.size} states`);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const deleteInvalid = args.includes('--delete-invalid');

  log.info('Starting validation');
  if (shouldFix) log.warn('FIX MODE - will attempt to fix issues');
  if (deleteInvalid) log.warn('DELETE MODE - will delete invalid records');

  // Fetch all springs
  log.info('Fetching springs...');
  const springs = await fetchAllSprings();
  log.info(`Found ${springs.length} springs`);

  if (springs.length === 0) {
    log.warn('No springs to validate');
    return;
  }

  // Validate each spring
  log.info('Validating...');
  const allIssues: ValidationIssue[] = [];

  for (const spring of springs) {
    const issues = validateSpring(spring as Record<string, unknown>);
    allIssues.push(...issues);
  }

  // Report issues by field
  const issuesByField = new Map<string, ValidationIssue[]>();
  for (const issue of allIssues) {
    if (!issuesByField.has(issue.field)) {
      issuesByField.set(issue.field, []);
    }
    issuesByField.get(issue.field)!.push(issue);
  }

  if (allIssues.length > 0) {
    log.warn(`Found ${allIssues.length} issues:`);
    for (const [field, issues] of issuesByField) {
      log.info(`  ${field}: ${issues.length} issues`);
      // Show first 3 examples
      for (const issue of issues.slice(0, 3)) {
        log.info(`    - ${issue.name}: ${issue.issue} (value: ${JSON.stringify(issue.currentValue)})`);
      }
    }
  } else {
    log.success('No validation issues found!');
  }

  // Find duplicates
  log.info('Checking for duplicates...');
  const duplicates = findDuplicates(springs as Record<string, unknown>[]);

  if (duplicates.length > 0) {
    log.warn(`Found ${duplicates.length} potential duplicate groups:`);
    for (const dupe of duplicates.slice(0, 10)) {
      log.info(`  "${dupe.name}" - ${dupe.ids.length} entries in states: ${dupe.states.join(', ')}`);
    }
    if (duplicates.length > 10) {
      log.info(`  ... and ${duplicates.length - 10} more`);
    }
  } else {
    log.success('No duplicates found!');
  }

  // Apply fixes if requested
  if (shouldFix && allIssues.length > 0) {
    log.info('Applying fixes...');
    let fixed = 0;

    for (const issue of allIssues) {
      if (issue.suggestedFix !== undefined) {
        const { error } = await supabase
          .from('springs')
          .update({ [issue.field]: issue.suggestedFix })
          .eq('id', issue.id);

        if (!error) {
          fixed++;
        }
      }
    }

    log.success(`Fixed ${fixed} issues`);
  }

  // Update state counts
  await updateStateCounts();

  // Summary
  log.done('Validation complete');
  log.info(`  Total springs: ${springs.length}`);
  log.info(`  Validation issues: ${allIssues.length}`);
  log.info(`  Duplicate groups: ${duplicates.length}`);
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
