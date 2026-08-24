import { getAudienceMetrics, registerSiteVisit } from '@/db/runtime';

export async function POST(request: Request) {
  const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)ib_vid=([^;]+)/)?.[1];
  const visitorId = cookie && /^[a-f0-9-]{16,64}$/i.test(cookie) ? cookie : crypto.randomUUID();
  const userAgent = request.headers.get('user-agent') || '';
  await registerSiteVisit(visitorId, userAgent);
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (!cookie) headers.append('Set-Cookie', `ib_vid=${visitorId}; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=Lax`);
  return Response.json(await getAudienceMetrics(), { headers });
}
