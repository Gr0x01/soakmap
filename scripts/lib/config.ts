/**
 * Pipeline configuration
 */
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '.env.local' });

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  TAVILY_API_KEY: z.string().min(1).optional(),
  DATAFORSEO_LOGIN: z.string().min(1).optional(),
  DATAFORSEO_PASSWORD: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  supabase: {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  },
  openai: {
    apiKey: parsed.data.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
  },
  tavily: {
    apiKey: parsed.data.TAVILY_API_KEY,
  },
  dataforseo: {
    login: parsed.data.DATAFORSEO_LOGIN,
    password: parsed.data.DATAFORSEO_PASSWORD,
  },
  // Rate limiting
  rateLimit: {
    swimmingholes: 500, // ms between requests
    idaho: 500, // ms between detail page requests
    soakoregon: 500, // ms between page requests
    tavily: 200,
    openai: 100,
    dataforseo: 500, // ms between API calls
  },
  // Batch sizes
  batch: {
    insert: 100, // springs per batch insert
    enrich: 50, // springs per enrichment batch
  },
} as const;
