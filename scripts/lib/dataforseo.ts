/**
 * DataForSEO API Client
 *
 * Provides typed access to DataForSEO Labs API endpoints for SEO research.
 * https://docs.dataforseo.com/v3/dataforseo_labs/
 */

import { config } from './config';
import { sleep, retry } from './utils';

const BASE_URL = 'https://api.dataforseo.com/v3';
const LOCATION_CODE = 2840; // United States
const LANGUAGE_CODE = 'en';

// Types for API responses
export interface KeywordInfo {
  search_volume: number;
  cpc: number;
  competition: number;
  competition_level: string;
}

export interface KeywordData {
  keyword: string;
  keyword_info: KeywordInfo;
  keyword_properties?: {
    keyword_difficulty?: number;
  };
}

export interface RankedKeyword {
  keyword_data: KeywordData;
  ranked_serp_element: {
    serp_item: {
      rank_absolute: number;
      rank_group: number;
      type: string;
      url: string;
      title?: string;
      etv?: number;
    };
  };
}

// Helper to extract values from nested structure
export function getSearchVolume(kw: RankedKeyword | RelatedKeyword): number {
  return kw.keyword_data?.keyword_info?.search_volume || 0;
}

export function getKeywordDifficulty(kw: RankedKeyword | RelatedKeyword): number {
  return kw.keyword_data?.keyword_properties?.keyword_difficulty || 50;
}

export function getCpc(kw: RankedKeyword | RelatedKeyword): number {
  return kw.keyword_data?.keyword_info?.cpc || 0;
}

export interface SerpCompetitor {
  domain: string;
  avg_position: number;
  sum_position: number;
  intersections: number;
  full_domain_metrics?: {
    organic?: {
      etv?: number;
      count?: number;
    };
  };
}

export interface RelatedKeyword {
  keyword_data: KeywordData;
  depth: number;
  related_keywords?: string[];
}

export interface KeywordDifficulty {
  keyword: string;
  keyword_difficulty: number;
}

interface ApiResponse<T> {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    result?: T[];
  }>;
}

export class DataForSEOClient {
  private auth: string;

  constructor() {
    if (!config.dataforseo.login || !config.dataforseo.password) {
      throw new Error('DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in .env.local');
    }
    this.auth = Buffer.from(`${config.dataforseo.login}:${config.dataforseo.password}`).toString('base64');
  }

  private async request<T>(endpoint: string, data: unknown[]): Promise<ApiResponse<T>> {
    await sleep(config.rateLimit.dataforseo);

    return retry(async () => {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    }, 3, 1000);
  }

  /**
   * Get SERP competitors - discover domains ranking for target keywords
   */
  async serpCompetitors(keywords: string[], limit = 100): Promise<SerpCompetitor[]> {
    const response = await this.request<{ items: SerpCompetitor[] }>(
      '/dataforseo_labs/google/competitors_domain/live',
      [{
        keywords,
        location_code: LOCATION_CODE,
        language_code: LANGUAGE_CODE,
        limit,
        filters: [
          ['intersections', '>', 1]
        ],
        order_by: ['intersections,desc'],
      }]
    );

    const result = response.tasks?.[0]?.result?.[0];
    return result?.items || [];
  }

  /**
   * Get ranked keywords for a domain
   */
  async rankedKeywords(
    domain: string,
    options: { limit?: number; minVolume?: number } = {}
  ): Promise<RankedKeyword[]> {
    const { limit = 1000, minVolume = 10 } = options;

    const response = await this.request<{ items: RankedKeyword[] }>(
      '/dataforseo_labs/google/ranked_keywords/live',
      [{
        target: domain,
        location_code: LOCATION_CODE,
        language_code: LANGUAGE_CODE,
        limit,
        filters: [
          ['keyword_data.keyword_info.search_volume', '>=', minVolume]
        ],
        order_by: ['keyword_data.keyword_info.search_volume,desc'],
      }]
    );

    const result = response.tasks?.[0]?.result?.[0];
    return result?.items || [];
  }

  /**
   * Get domain intersection - keywords shared between domains
   */
  async domainIntersection(
    domain1: string,
    domain2: string,
    options: { limit?: number } = {}
  ): Promise<RankedKeyword[]> {
    const { limit = 1000 } = options;

    const response = await this.request<{ items: RankedKeyword[] }>(
      '/dataforseo_labs/google/domain_intersection/live',
      [{
        target1: domain1,
        target2: domain2,
        location_code: LOCATION_CODE,
        language_code: LANGUAGE_CODE,
        limit,
        intersections: true,
        order_by: ['keyword_data.keyword_info.search_volume,desc'],
      }]
    );

    const result = response.tasks?.[0]?.result?.[0];
    return result?.items || [];
  }

  /**
   * Get related keywords - long-tail variations
   */
  async relatedKeywords(
    keyword: string,
    options: { limit?: number; depth?: number } = {}
  ): Promise<RelatedKeyword[]> {
    const { limit = 500, depth = 2 } = options;

    const response = await this.request<{ items: RelatedKeyword[] }>(
      '/dataforseo_labs/google/related_keywords/live',
      [{
        keyword,
        location_code: LOCATION_CODE,
        language_code: LANGUAGE_CODE,
        limit,
        depth,
        include_serp_info: true,
      }]
    );

    const result = response.tasks?.[0]?.result?.[0];
    return result?.items || [];
  }

  /**
   * Get bulk keyword difficulty scores
   */
  async bulkKeywordDifficulty(keywords: string[]): Promise<KeywordDifficulty[]> {
    // API allows max 1000 keywords per request
    const batch = keywords.slice(0, 1000);

    const response = await this.request<{ items: KeywordDifficulty[] }>(
      '/dataforseo_labs/google/bulk_keyword_difficulty/live',
      [{
        keywords: batch,
        location_code: LOCATION_CODE,
        language_code: LANGUAGE_CODE,
      }]
    );

    const result = response.tasks?.[0]?.result?.[0];
    return result?.items || [];
  }

  /**
   * Get API cost from last response
   */
  getLastCost(response: ApiResponse<unknown>): number {
    return response.cost || 0;
  }
}

// Singleton instance
let client: DataForSEOClient | null = null;

export function getDataForSEOClient(): DataForSEOClient {
  if (!client) {
    client = new DataForSEOClient();
  }
  return client;
}
