import { getListingDestination, registerListingClick } from '@/db/runtime';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-z0-9-]{1,64}$/i.test(id)) return new Response('Not found', { status: 404 });
  const destinationUrl = await getListingDestination(id);
  if (!destinationUrl) return new Response('Not found', { status: 404 });
  const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)ib_vid=([^;]+)/)?.[1];
  const visitorId = cookie && /^[a-f0-9-]{16,64}$/i.test(cookie) ? cookie : crypto.randomUUID();
  await registerListingClick(id, visitorId, request.headers.get('user-agent') ?? '');
  const headers = new Headers({ Location: destinationUrl, 'Cache-Control': 'no-store', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  if (!cookie) headers.append('Set-Cookie', `ib_vid=${visitorId}; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=Lax`);
  return new Response(null, { status: 302, headers });
}
