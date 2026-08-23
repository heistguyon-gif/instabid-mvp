import { getLeaderboard } from '@/db/runtime';

export async function GET(request: Request) {
  const marketParam = new URL(request.url).searchParams.get('market');
  const market = marketParam === 'world' ? 'world' : 'br';
  const listings = await getLeaderboard(market);
  return Response.json({ market, listings }, { headers: { 'Cache-Control': 'public, max-age=15' } });
}
