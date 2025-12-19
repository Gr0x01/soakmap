#!/usr/bin/env npx tsx
/**
 * Pipeline orchestrator
 *
 * Usage:
 *   npx tsx scripts/run-pipeline.ts [stages...] [--dry-run]
 *
 * Stages:
 *   gnis          - Import USGS GNIS hot springs
 *   swimmingholes - Scrape swimmingholes.org
 *   enrich        - Enrich with Tavily + OpenAI
 *   validate      - Validate and update counts
 *   all           - Run all stages
 *
 * Examples:
 *   npx tsx scripts/run-pipeline.ts gnis swimmingholes
 *   npx tsx scripts/run-pipeline.ts enrich --dry-run
 *   npx tsx scripts/run-pipeline.ts all
 */

import { spawn } from 'child_process';
import { createLogger } from './lib/logger';

const log = createLogger('Pipeline');

const STAGES = {
  gnis: {
    script: '01-import-gnis.ts',
    description: 'Import USGS GNIS hot springs',
  },
  swimmingholes: {
    script: '02-scrape-swimmingholes.ts',
    description: 'Scrape swimmingholes.org',
  },
  enrich: {
    script: '04-enrich-springs.ts',
    description: 'Enrich with Tavily + OpenAI',
  },
  validate: {
    script: '05-validate-data.ts',
    description: 'Validate and update counts',
  },
};

type StageName = keyof typeof STAGES;

function runScript(script: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['tsx', `scripts/${script}`, ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    proc.on('close', (code) => {
      resolve(code || 0);
    });

    proc.on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const stages = args.filter((a) => !a.startsWith('--'));

  // Expand 'all' to all stages
  const stagesToRun: StageName[] =
    stages.includes('all')
      ? (Object.keys(STAGES) as StageName[])
      : (stages as StageName[]);

  if (stagesToRun.length === 0) {
    console.log(`
Pipeline Orchestrator

Usage: npx tsx scripts/run-pipeline.ts [stages...] [--dry-run]

Available stages:
${Object.entries(STAGES)
  .map(([name, info]) => `  ${name.padEnd(15)} - ${info.description}`)
  .join('\n')}
  all             - Run all stages in order

Options:
  --dry-run       - Run without making changes

Examples:
  npx tsx scripts/run-pipeline.ts gnis swimmingholes
  npx tsx scripts/run-pipeline.ts enrich --limit 10
  npx tsx scripts/run-pipeline.ts all --dry-run
`);
    return;
  }

  // Validate stages
  for (const stage of stagesToRun) {
    if (!STAGES[stage]) {
      log.error(`Unknown stage: ${stage}`);
      log.info(`Available stages: ${Object.keys(STAGES).join(', ')}`);
      process.exit(1);
    }
  }

  log.info(`Running pipeline stages: ${stagesToRun.join(' → ')}`);
  if (dryRun) log.warn('DRY RUN MODE');

  const stageArgs = dryRun ? ['--dry-run'] : [];
  const results: { stage: string; code: number; duration: number }[] = [];

  for (const stage of stagesToRun) {
    const info = STAGES[stage];
    log.info(`\n${'='.repeat(60)}`);
    log.info(`Stage: ${stage} - ${info.description}`);
    log.info('='.repeat(60));

    const start = Date.now();
    const code = await runScript(info.script, stageArgs);
    const duration = Date.now() - start;

    results.push({ stage, code, duration });

    if (code !== 0) {
      log.error(`Stage ${stage} failed with code ${code}`);
      // Continue to next stage anyway
    }
  }

  // Summary
  log.info(`\n${'='.repeat(60)}`);
  log.info('Pipeline Summary');
  log.info('='.repeat(60));

  for (const result of results) {
    const status = result.code === 0 ? '✓' : '✗';
    const time = result.duration < 1000
      ? `${result.duration}ms`
      : `${(result.duration / 1000).toFixed(1)}s`;
    log.info(`  ${status} ${result.stage.padEnd(15)} ${time}`);
  }

  const failed = results.filter((r) => r.code !== 0);
  if (failed.length > 0) {
    log.error(`${failed.length} stage(s) failed`);
    process.exit(1);
  }

  log.success('Pipeline complete!');
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
