#!/usr/bin/env npx tsx
/**
 * SEO Keyword Research using DataForSEO API
 *
 * Usage:
 *   npx tsx scripts/seo-research.ts [--step N] [--dry-run]
 *
 * Steps:
 *   1 - Discover SERP competitors
 *   2 - Analyze competitor keywords
 *   3 - Find domain intersections
 *   4 - Expand with related keywords
 *   5 - Assess keyword difficulty
 *   all - Run complete pipeline
 */

import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from './lib/logger';
import {
  getDataForSEOClient,
  getSearchVolume,
  getKeywordDifficulty,
  getCpc,
  type SerpCompetitor,
  type RankedKeyword,
  type RelatedKeyword,
  type KeywordDifficulty,
} from './lib/dataforseo';

const log = createLogger('SEO-Research');

// Configuration
const DATA_DIR = path.join(process.cwd(), 'data/seo-research');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const PROCESSED_DIR = path.join(DATA_DIR, 'processed');

// Known competitors to always analyze
const KNOWN_COMPETITORS = [
  'findaspring.com',
  'swimmingholes.org',
  'soakmap.com',
];

// Seed keywords for competitor discovery
const SEED_KEYWORDS = [
  // Primary terms
  'hot springs',
  'hot springs near me',
  'natural hot springs',
  'swimming holes',
  'swimming holes near me',
  // Experience types
  'free hot springs',
  'primitive hot springs',
  'hot spring resorts',
  'clothing optional hot springs',
  // Top hot spring states
  'hot springs california',
  'hot springs colorado',
  'hot springs idaho',
  'hot springs oregon',
  'hot springs montana',
  'hot springs wyoming',
  'hot springs utah',
  'hot springs new mexico',
  // Long-tail
  'natural swimming holes',
  'best hot springs',
  'hot springs camping',
];

// Parse CLI arguments
function parseArgs(): { step: string; dryRun: boolean } {
  const args = process.argv.slice(2);
  let step = 'all';
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--step' && args[i + 1]) {
      step = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { step, dryRun };
}

// Ensure directories exist
function ensureDirectories() {
  fs.mkdirSync(path.join(RAW_DIR, 'ranked-keywords'), { recursive: true });
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

// Save JSON data
function saveJson(filename: string, data: unknown) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  log.success(`Saved ${filepath}`);
}

// Load JSON data
function loadJson<T>(filename: string): T | null {
  const filepath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }
  return null;
}

// Step 1: Discover SERP competitors
async function discoverCompetitors(dryRun: boolean): Promise<SerpCompetitor[]> {
  log.info(`Step 1: Discovering SERP competitors for ${SEED_KEYWORDS.length} keywords...`);

  if (dryRun) {
    log.warn('Dry run - skipping API call');
    return [];
  }

  const client = getDataForSEOClient();
  const competitors = await client.serpCompetitors(SEED_KEYWORDS, 100);

  saveJson('raw/serp-competitors.json', {
    timestamp: new Date().toISOString(),
    seed_keywords: SEED_KEYWORDS,
    competitors_count: competitors.length,
    competitors,
  });

  log.success(`Found ${competitors.length} SERP competitors`);
  return competitors;
}

// Step 2: Analyze competitor keywords
async function analyzeCompetitorKeywords(
  competitors: SerpCompetitor[],
  dryRun: boolean
): Promise<Map<string, RankedKeyword[]>> {
  // Combine known competitors with top discovered ones
  const topDiscovered = competitors
    .filter(c => !KNOWN_COMPETITORS.includes(c.domain))
    .slice(0, 5)
    .map(c => c.domain);

  const domainsToAnalyze = Array.from(new Set([...KNOWN_COMPETITORS, ...topDiscovered]));

  log.info(`Step 2: Analyzing keywords for ${domainsToAnalyze.length} domains...`);
  log.info(`Domains: ${domainsToAnalyze.join(', ')}`);

  const results = new Map<string, RankedKeyword[]>();

  if (dryRun) {
    log.warn('Dry run - skipping API calls');
    return results;
  }

  const client = getDataForSEOClient();

  for (const domain of domainsToAnalyze) {
    log.info(`  Fetching keywords for ${domain}...`);
    try {
      const keywords = await client.rankedKeywords(domain, { limit: 1000, minVolume: 10 });
      results.set(domain, keywords);

      const safeDomain = domain.replace(/\./g, '_');
      saveJson(`raw/ranked-keywords/${safeDomain}.json`, {
        timestamp: new Date().toISOString(),
        domain,
        keywords_count: keywords.length,
        keywords,
      });

      log.success(`  ${domain}: ${keywords.length} keywords`);
    } catch (error) {
      log.error(`  Failed to fetch keywords for ${domain}: ${error}`);
    }
  }

  return results;
}

// Step 3: Find domain intersections
async function findIntersections(dryRun: boolean): Promise<void> {
  const comparisons = [
    ['soakmap.com', 'findaspring.com'],
    ['soakmap.com', 'swimmingholes.org'],
    ['findaspring.com', 'swimmingholes.org'],
  ];

  log.info(`Step 3: Finding domain intersections (${comparisons.length} comparisons)...`);

  if (dryRun) {
    log.warn('Dry run - skipping API calls');
    return;
  }

  const client = getDataForSEOClient();
  const results: Record<string, RankedKeyword[]> = {};

  for (const [domain1, domain2] of comparisons) {
    log.info(`  Comparing ${domain1} vs ${domain2}...`);
    try {
      const intersection = await client.domainIntersection(domain1, domain2, { limit: 500 });
      const key = `${domain1.replace(/\./g, '_')}_vs_${domain2.replace(/\./g, '_')}`;
      results[key] = intersection;
      log.success(`  Found ${intersection.length} overlapping keywords`);
    } catch (error) {
      log.error(`  Failed: ${error}`);
    }
  }

  saveJson('raw/domain-intersection.json', {
    timestamp: new Date().toISOString(),
    comparisons: results,
  });
}

// Step 4: Expand with related keywords
async function expandRelatedKeywords(dryRun: boolean): Promise<RelatedKeyword[]> {
  const seedsForExpansion = [
    'hot springs',
    'swimming holes',
    'natural springs',
    'hot springs near me',
    'free hot springs',
  ];

  log.info(`Step 4: Expanding related keywords for ${seedsForExpansion.length} seeds...`);

  if (dryRun) {
    log.warn('Dry run - skipping API calls');
    return [];
  }

  const client = getDataForSEOClient();
  const allRelated: RelatedKeyword[] = [];

  for (const seed of seedsForExpansion) {
    log.info(`  Expanding "${seed}"...`);
    try {
      const related = await client.relatedKeywords(seed, { limit: 300, depth: 2 });
      allRelated.push(...related);
      log.success(`  Found ${related.length} related keywords`);
    } catch (error) {
      log.error(`  Failed: ${error}`);
    }
  }

  // Deduplicate by keyword
  const unique = Array.from(
    new Map(allRelated.map(r => [r.keyword_data.keyword, r])).values()
  );

  saveJson('raw/related-keywords.json', {
    timestamp: new Date().toISOString(),
    seeds: seedsForExpansion,
    total_keywords: unique.length,
    keywords: unique,
  });

  log.success(`Total unique related keywords: ${unique.length}`);
  return unique;
}

// Step 5: Assess keyword difficulty
async function assessDifficulty(
  competitorKeywords: Map<string, RankedKeyword[]>,
  relatedKeywords: RelatedKeyword[],
  dryRun: boolean
): Promise<KeywordDifficulty[]> {
  // Collect priority keywords from all sources
  const keywordSet = new Set<string>();

  // Add top keywords from competitors
  for (const keywords of Array.from(competitorKeywords.values())) {
    keywords.slice(0, 200).forEach(k => keywordSet.add(k.keyword_data.keyword));
  }

  // Add related keywords
  relatedKeywords.slice(0, 300).forEach(k => keywordSet.add(k.keyword_data.keyword));

  const priorityKeywords = Array.from(keywordSet).slice(0, 1000);

  log.info(`Step 5: Assessing difficulty for ${priorityKeywords.length} keywords...`);

  if (dryRun) {
    log.warn('Dry run - skipping API call');
    return [];
  }

  const client = getDataForSEOClient();
  const difficulties = await client.bulkKeywordDifficulty(priorityKeywords);

  saveJson('raw/keyword-difficulty.json', {
    timestamp: new Date().toISOString(),
    keywords_count: difficulties.length,
    difficulties,
  });

  log.success(`Got difficulty scores for ${difficulties.length} keywords`);
  return difficulties;
}

// Generate processed analysis
function generateAnalysis() {
  log.info('Generating processed analysis...');

  // Load raw data
  const competitors = loadJson<{ competitors: SerpCompetitor[] }>('raw/serp-competitors.json');
  // intersection and related are loaded for future expansion but not currently used in analysis
  loadJson<{ comparisons: Record<string, RankedKeyword[]> }>('raw/domain-intersection.json');
  loadJson<{ keywords: RelatedKeyword[] }>('raw/related-keywords.json');
  const difficulty = loadJson<{ difficulties: KeywordDifficulty[] }>('raw/keyword-difficulty.json');

  // Load ranked keywords for each domain
  const rankedKeywordsDir = path.join(RAW_DIR, 'ranked-keywords');
  const rankedKeywordFiles = fs.existsSync(rankedKeywordsDir)
    ? fs.readdirSync(rankedKeywordsDir).filter(f => f.endsWith('.json'))
    : [];

  const allRankedKeywords: Record<string, RankedKeyword[]> = {};
  for (const file of rankedKeywordFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(rankedKeywordsDir, file), 'utf-8'));
    allRankedKeywords[data.domain] = data.keywords;
  }

  // Build difficulty lookup
  const difficultyMap = new Map(
    difficulty?.difficulties.map(d => [d.keyword, d.keyword_difficulty]) || []
  );

  // Find opportunities: keywords competitors rank for that we don't (or rank poorly)
  const soakmapKeywords = new Set(
    (allRankedKeywords['soakmap.com'] || []).map(k => k.keyword_data.keyword)
  );

  interface KeywordOpportunity {
    keyword: string;
    search_volume: number;
    keyword_difficulty: number;
    cpc: number;
    competitor_rankings: Record<string, number>;
    soakmap_ranking: number | null;
    opportunity_score: number;
  }

  const opportunities: KeywordOpportunity[] = [];

  // Analyze competitor keywords for gaps
  for (const [domain, keywords] of Object.entries(allRankedKeywords)) {
    if (domain === 'soakmap.com') continue;

    for (const kw of keywords) {
      const keyword = kw.keyword_data.keyword;
      const volume = getSearchVolume(kw);
      const kd = difficultyMap.get(keyword) || getKeywordDifficulty(kw);
      const cpc = getCpc(kw);

      // Skip if we already rank well
      const soakmapRank = allRankedKeywords['soakmap.com']?.find(
        k => k.keyword_data.keyword === keyword
      )?.ranked_serp_element?.serp_item?.rank_absolute;

      if (soakmapRank && soakmapRank <= 10) continue;

      // Calculate opportunity score
      // Higher volume, lower difficulty, competitor success = higher score
      const volumeScore = Math.min(volume / 1000, 10);
      const difficultyScore = (100 - (kd || 50)) / 10;
      const gapBonus = !soakmapKeywords.has(keyword) ? 5 : 0;

      const score = volumeScore + difficultyScore + gapBonus;

      // Check if we already have this keyword
      const existing = opportunities.find(o => o.keyword === keyword);
      if (existing) {
        existing.competitor_rankings[domain] = kw.ranked_serp_element?.serp_item?.rank_absolute || 0;
      } else {
        opportunities.push({
          keyword,
          search_volume: volume,
          keyword_difficulty: kd || 50,
          cpc,
          competitor_rankings: {
            [domain]: kw.ranked_serp_element?.serp_item?.rank_absolute || 0,
          },
          soakmap_ranking: soakmapRank || null,
          opportunity_score: score,
        });
      }
    }
  }

  // Sort by opportunity score
  opportunities.sort((a, b) => b.opportunity_score - a.opportunity_score);

  // Categorize opportunities
  const quickWins = opportunities.filter(
    o => o.keyword_difficulty < 30 && o.search_volume > 100
  ).slice(0, 50);

  const mediumPriority = opportunities.filter(
    o => o.keyword_difficulty >= 30 && o.keyword_difficulty < 50 && o.search_volume > 200
  ).slice(0, 50);

  const longTerm = opportunities.filter(
    o => o.keyword_difficulty >= 50 && o.search_volume > 500
  ).slice(0, 30);

  saveJson('processed/keyword-opportunities.json', {
    timestamp: new Date().toISOString(),
    summary: {
      total_opportunities: opportunities.length,
      quick_wins: quickWins.length,
      medium_priority: mediumPriority.length,
      long_term: longTerm.length,
    },
    quick_wins: quickWins,
    medium_priority: mediumPriority,
    long_term: longTerm,
    all_opportunities: opportunities.slice(0, 200),
  });

  // Generate competitor summary
  saveJson('processed/competitor-summary.json', {
    timestamp: new Date().toISOString(),
    serp_competitors: competitors?.competitors.slice(0, 20).map(c => ({
      domain: c.domain,
      intersections: c.intersections,
      avg_position: c.avg_position,
      etv: c.full_domain_metrics?.organic?.etv,
    })),
    domain_keywords: Object.entries(allRankedKeywords).map(([domain, keywords]) => ({
      domain,
      total_keywords: keywords.length,
      top_keywords: keywords.slice(0, 10).map(k => ({
        keyword: k.keyword_data.keyword,
        volume: k.keyword_data.search_volume,
        position: k.ranked_serp_element?.serp_item?.rank_absolute,
      })),
    })),
  });

  log.success('Analysis complete!');
  log.info(`Quick wins: ${quickWins.length}`);
  log.info(`Medium priority: ${mediumPriority.length}`);
  log.info(`Long-term targets: ${longTerm.length}`);
}

// Generate strategy document
function generateStrategyDoc() {
  log.info('Generating strategy document...');

  const opportunities = loadJson<{
    summary: { total_opportunities: number; quick_wins: number; medium_priority: number; long_term: number };
    quick_wins: Array<{ keyword: string; search_volume: number; keyword_difficulty: number; competitor_rankings: Record<string, number> }>;
    medium_priority: Array<{ keyword: string; search_volume: number; keyword_difficulty: number }>;
    long_term: Array<{ keyword: string; search_volume: number; keyword_difficulty: number }>;
  }>('processed/keyword-opportunities.json');

  const competitors = loadJson<{
    serp_competitors: Array<{ domain: string; intersections: number; avg_position: number; etv?: number }>;
    domain_keywords: Array<{ domain: string; total_keywords: number; top_keywords: Array<{ keyword: string; volume: number; position: number }> }>;
  }>('processed/competitor-summary.json');

  if (!opportunities || !competitors) {
    log.error('Missing processed data. Run analysis first.');
    return;
  }

  const doc = `---
Last-Updated: ${new Date().toISOString().split('T')[0]}
Maintainer: Claude
Status: Active
---

# SEO Strategy: SoakMap

## Executive Summary

Based on DataForSEO analysis of the hot springs and swimming holes keyword landscape:

- **${opportunities.summary.total_opportunities}** keyword opportunities identified
- **${opportunities.summary.quick_wins}** quick wins (low difficulty, good volume)
- **${competitors.serp_competitors?.length || 0}** SERP competitors discovered
- Top competitors: ${competitors.serp_competitors?.slice(0, 3).map(c => c.domain).join(', ') || 'N/A'}

---

## Competitive Landscape

### Top SERP Competitors

${competitors.serp_competitors?.slice(0, 10).map((c, i) =>
    `${i + 1}. **${c.domain}** - ${c.intersections} keyword overlaps, avg position ${c.avg_position?.toFixed(1) || 'N/A'}${c.etv ? `, ~${c.etv.toLocaleString()} monthly traffic` : ''}`
  ).join('\n') || 'No data available'}

### Competitor Keyword Counts

${competitors.domain_keywords?.map(d =>
    `- **${d.domain}**: ${d.total_keywords.toLocaleString()} ranked keywords`
  ).join('\n') || 'No data available'}

---

## Keyword Opportunities

### Quick Wins (Low Difficulty, Good Volume)

Target these first - low competition, achievable rankings:

| Keyword | Volume | Difficulty | Competitor Position |
|---------|--------|------------|---------------------|
${opportunities.quick_wins.slice(0, 15).map(k =>
    `| ${k.keyword} | ${k.search_volume.toLocaleString()} | ${k.keyword_difficulty} | ${Object.entries(k.competitor_rankings).map(([d, p]) => `${d.split('.')[0]}:#${p}`).join(', ')} |`
  ).join('\n')}

### Medium Priority (Moderate Difficulty)

Build content and authority to capture these:

| Keyword | Volume | Difficulty |
|---------|--------|------------|
${opportunities.medium_priority.slice(0, 10).map(k =>
    `| ${k.keyword} | ${k.search_volume.toLocaleString()} | ${k.keyword_difficulty} |`
  ).join('\n')}

### Long-Term Targets (High Value, High Competition)

Require sustained effort and link building:

| Keyword | Volume | Difficulty |
|---------|--------|------------|
${opportunities.long_term.slice(0, 10).map(k =>
    `| ${k.keyword} | ${k.search_volume.toLocaleString()} | ${k.keyword_difficulty} |`
  ).join('\n')}

---

## Recommendations

### Immediate Actions

1. **Optimize existing pages** for quick-win keywords
2. **Add internal links** using target keyword anchor text
3. **Update meta titles/descriptions** to include target terms

### Content Gaps to Fill

Based on competitor analysis, consider adding:

${opportunities.quick_wins.slice(0, 5).map(k =>
    `- Content targeting: "${k.keyword}" (vol: ${k.search_volume})`
  ).join('\n')}

### Page Types to Consider

- City-specific pages: "hot springs near [city]"
- State + activity combos: "[state] swimming holes"
- Feature-focused: "free hot springs [state]"

---

## Data Sources

- Research date: ${new Date().toISOString().split('T')[0]}
- API: DataForSEO Labs
- Raw data: \`data/seo-research/raw/\`
- Processed: \`data/seo-research/processed/\`
`;

  const strategyPath = path.join(process.cwd(), 'memory-bank/development/seo-strategy.md');
  fs.writeFileSync(strategyPath, doc);
  log.success(`Strategy document saved to ${strategyPath}`);
}

// Main execution
async function main() {
  const { step, dryRun } = parseArgs();

  log.info('='.repeat(50));
  log.info('SoakMap SEO Research Pipeline');
  log.info('='.repeat(50));

  if (dryRun) {
    log.warn('DRY RUN MODE - No API calls will be made');
  }

  ensureDirectories();

  let competitors: SerpCompetitor[] = [];
  let competitorKeywords = new Map<string, RankedKeyword[]>();
  let relatedKeywords: RelatedKeyword[] = [];

  try {
    if (step === 'all' || step === '1') {
      competitors = await discoverCompetitors(dryRun);
    } else {
      // Load from file if skipping step 1
      const data = loadJson<{ competitors: SerpCompetitor[] }>('raw/serp-competitors.json');
      competitors = data?.competitors || [];
    }

    if (step === 'all' || step === '2') {
      competitorKeywords = await analyzeCompetitorKeywords(competitors, dryRun);
    }

    if (step === 'all' || step === '3') {
      await findIntersections(dryRun);
    }

    if (step === 'all' || step === '4') {
      relatedKeywords = await expandRelatedKeywords(dryRun);
    } else {
      const data = loadJson<{ keywords: RelatedKeyword[] }>('raw/related-keywords.json');
      relatedKeywords = data?.keywords || [];
    }

    if (step === 'all' || step === '5') {
      await assessDifficulty(competitorKeywords, relatedKeywords, dryRun);
    }

    // Always generate analysis if we have data
    if (!dryRun && (step === 'all' || step === 'analyze')) {
      generateAnalysis();
      generateStrategyDoc();
    }

    log.done('SEO research pipeline');
  } catch (error) {
    log.error(`Pipeline failed: ${error}`);
    process.exit(1);
  }
}

main();
