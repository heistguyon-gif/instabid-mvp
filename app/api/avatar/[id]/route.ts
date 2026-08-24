export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Not found', { status: 404 });
  const runtime = await import('cloudflare:workers') as { env: { FILES: R2Bucket } };
  const object = await runtime.env.FILES.get(`avatars/${id}`);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(object.body, { headers });
}
