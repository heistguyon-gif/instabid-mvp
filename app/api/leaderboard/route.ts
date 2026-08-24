import { applyVerifiedTransaction, getLeaderboard, takePendingPaymentsForReconciliation, type RankingPeriod } from '@/db/runtime';
import { getBravopayTransaction } from '@/lib/bravopay';

export async function GET(request: Request) {
  const marketParam = new URL(request.url).searchParams.get('market');
  const periodParam = new URL(request.url).searchParams.get('period');
  const market = marketParam === 'world' ? 'world' : 'br';
  const period: RankingPeriod = periodParam === 'all' || periodParam === 'today' ? periodParam : 'week';
  if (market === 'br') {
    const pending = await takePendingPaymentsForReconciliation().catch(() => []);
    await Promise.all(pending.map(async (payment) => {
      try {
        await applyVerifiedTransaction(await getBravopayTransaction(payment.providerPaymentId));
      } catch {
        // The next eligible leaderboard request retries reconciliation.
      }
    }));
  }
  const listings = await getLeaderboard(market, period);
  const totalClicks = listings.reduce((sum, item) => sum + Number(item.clicks ?? 0), 0);
  const dataMode = listings.every((item) => /^(br|world)-/.test(String(item.id))) ? 'demo' : 'pilot';
  return Response.json({ market, period, listings, meta: { activeListings: listings.length, totalClicks, generatedAt: new Date().toISOString(), dataMode } },
    { headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=30' } });
}
