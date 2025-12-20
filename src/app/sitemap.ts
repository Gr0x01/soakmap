import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getAllCitySlugs } from '@/lib/data/cities';
import { env } from '@/lib/env';

const BASE_URL = 'https://soakmap.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // State pages - states don't have updated_at, use current date
  const { data: states } = await supabase
    .from('states')
    .select('code')
    .gt('spring_count', 0);

  const statePages: MetadataRoute.Sitemap = (states || []).map((state) => ({
    url: `${BASE_URL}/states/${state.code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Spring detail pages - use actual updated_at from database
  const { data: springs } = await supabase
    .from('springs')
    .select('slug, updated_at');

  const springPages: MetadataRoute.Sitemap = (springs || []).map((spring) => ({
    url: `${BASE_URL}/springs/${spring.slug}`,
    lastModified: spring.updated_at ? new Date(spring.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Near city pages
  const citySlugs = getAllCitySlugs();
  const nearPages: MetadataRoute.Sitemap = citySlugs.map((slug) => ({
    url: `${BASE_URL}/near/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...statePages, ...springPages, ...nearPages];
}
