import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getAllCitySlugs } from '@/lib/data/cities';
import { VALID_TAG_SLUGS } from '@/lib/data/tag-content';

const BASE_URL = 'https://soakmap.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use env vars directly - NEXT_PUBLIC_ vars are available at build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Static pages - always included
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // "Near me" landing pages - high priority SEO pages
  const nearMePages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/hot-springs-near-me`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/swimming-holes-near-me`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/natural-springs-near-me`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Tag pages - high priority SEO pages for filtering
  const tagPages: MetadataRoute.Sitemap = VALID_TAG_SLUGS.map((tag) => ({
    url: `${BASE_URL}/tag/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // If no Supabase config, return static + near me + tag pages only (build-time fallback)
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Sitemap: Missing Supabase env vars, returning static pages only');
    return [...staticPages, ...nearMePages, ...tagPages];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // State pages - states don't have updated_at, use current date
  const { data: states, error: statesError } = await supabase
    .from('states')
    .select('code')
    .gt('spring_count', 0);

  if (statesError) {
    console.error('Sitemap: Error fetching states:', statesError);
  }

  const statePages: MetadataRoute.Sitemap = (states || []).map((state) => ({
    url: `${BASE_URL}/states/${state.code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Spring detail pages - use actual updated_at from database
  const { data: springs, error: springsError } = await supabase
    .from('springs')
    .select('slug, updated_at');

  if (springsError) {
    console.error('Sitemap: Error fetching springs:', springsError);
  }

  const springPages: MetadataRoute.Sitemap = (springs || []).map((spring) => ({
    url: `${BASE_URL}/springs/${spring.slug}`,
    lastModified: spring.updated_at ? new Date(spring.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Near city pages (raised priority for long-tail SEO)
  const citySlugs = getAllCitySlugs();
  const nearCityPages: MetadataRoute.Sitemap = citySlugs.map((slug) => ({
    url: `${BASE_URL}/near/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...nearMePages, ...tagPages, ...statePages, ...springPages, ...nearCityPages];
}
