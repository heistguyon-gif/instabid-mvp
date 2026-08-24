import { applyVerifiedTransaction, getAudienceMetrics, getLeaderboard, takePendingPaymentsForReconciliation, type RankingPeriod } from '@/db/runtime';
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
  const audience = await getAudienceMetrics();
  return Response.json({ market, period, listings, meta: { activeListings: listings.length, totalClicks, ...audience, generatedAt: new Date().toISOString(), dataMode: 'pilot' } },
    { headers: { 'Cache-Control': 'no-store' } });
}
