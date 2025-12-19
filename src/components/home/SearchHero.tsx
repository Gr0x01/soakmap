import { db } from '@/lib/supabase';
import { SearchHeroClient } from './SearchHeroClient';

export async function SearchHero() {
  // Fetch real stats from database
  const [statsResult, statesResult] = await Promise.all([
    db.getStats(),
    db.getStates(),
  ]);

  const stats = statsResult.ok ? statsResult.data : { total: 0, hot: 0, warm: 0, cold: 0 };
  const states = statesResult.ok
    ? statesResult.data.map((s) => ({ code: s.code, name: s.name, count: s.spring_count }))
    : [];

  return (
    <SearchHeroClient
      stats={{
        springs: stats.total,
        states: states.length,
        hot: stats.hot,
        warm: stats.warm,
        cold: stats.cold,
      }}
      states={states}
    />
  );
}
