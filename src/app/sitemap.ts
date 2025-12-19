import { MetadataRoute } from 'next';
import { db } from '@/lib/supabase';
import { getAllCitySlugs } from '@/lib/data/cities';

const BASE_URL = 'https://soakmap.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // State pages
  const statesResult = await db.getStates();
  const statePages: MetadataRoute.Sitemap = statesResult.ok
    ? statesResult.data.map((state) => ({
        url: `${BASE_URL}/states/${state.code.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    : [];

  // Spring detail pages
  const springsResult = await db.getSpringSlugs();
  const springPages: MetadataRoute.Sitemap = springsResult.ok
    ? springsResult.data.map((spring) => ({
        url: `${BASE_URL}/springs/${spring.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    : [];

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
