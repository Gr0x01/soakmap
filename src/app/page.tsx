import { Header, Footer } from '@/components/layout';
import { SearchHero, FeaturedSprings } from '@/components/home';

export const revalidate = 3600; // Revalidate every hour

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <SearchHero />
        <FeaturedSprings />
      </main>

      <Footer />
    </div>
  );
}
