/**
 * Supabase client for scripts (uses service role key)
 */
import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import type { Database } from '@/types/database';

export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type SpringInsert = Database['public']['Tables']['springs']['Insert'];
export type SpringRow = Database['public']['Tables']['springs']['Row'];
