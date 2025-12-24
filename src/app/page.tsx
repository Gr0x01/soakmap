import { Metadata } from 'next';
import { Header, Footer } from '@/components/layout';
import { SearchHero, FeaturedSprings } from '@/components/home';
import { safeJsonLd, generateWebSiteSchema, generateOrganizationSchema } from '@/lib/schema';

export const revalidate = 86400; // Revalidate every 24 hours

export const metadata: Metadata = {
  title: 'SoakMap - Find Hot Springs & Swimming Holes Near You',
  description:
    'Discover 2,900+ natural hot springs and swimming holes across America. Filter by temperature, experience type, and location to find your perfect soak.',
  alternates: {
    canonical: 'https://soakmap.com',
  },
  openGraph: {
    title: 'SoakMap - Find Hot Springs & Swimming Holes Near You',
    description:
      'Discover 2,900+ natural hot springs and swimming holes across America. Filter by temperature, experience type, and location to find your perfect soak.',
    type: 'website',
    url: 'https://soakmap.com',
    siteName: 'SoakMap',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoakMap - Find Hot Springs & Swimming Holes Near You',
    description:
      'Discover 2,900+ natural hot springs and swimming holes across America. Filter by temperature, experience type, and location.',
  },
};

export default function Home() {
  const websiteSchema = generateWebSiteSchema();
  const organizationSchema = generateOrganizationSchema();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Structured Data for Knowledge Graph */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}
      />

      <Header />

      <main className="flex-1">
        <SearchHero />
        <FeaturedSprings />
      </main>

      <Footer />
    </div>
  );
}
