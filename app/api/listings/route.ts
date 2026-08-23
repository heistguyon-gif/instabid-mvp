import { createPendingListing } from '@/db/runtime';

const handlePattern = /^@[a-zA-Z0-9._]{1,30}$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const market = body.market === 'world' ? 'world' : body.market === 'br' ? 'br' : null;
  const name = String(body.name ?? '').trim().slice(0, 60);
  const rawHandle = String(body.handle ?? '').trim();
  const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
  const description = String(body.description ?? '').trim().slice(0, 220);
  const contactEmail = String(body.contactEmail ?? '').trim().toLowerCase().slice(0, 160);
  const category = String(body.category ?? '').trim().slice(0, 40);

  let destinationUrl: URL;
  try {
    destinationUrl = new URL(String(body.destinationUrl ?? ''));
  } catch {
    return Response.json({ error: 'invalid_url' }, { status: 400 });
  }

  if (!market || name.length < 2 || !handlePattern.test(handle) || description.length < 12 ||
      !contactEmail.includes('@') || category.length < 2 || !['https:', 'http:'].includes(destinationUrl.protocol)) {
    return Response.json({ error: 'invalid_fields' }, { status: 400 });
  }

  try {
    const listing = await createPendingListing({
      market, name, handle: handle.toLowerCase(), description,
      destinationUrl: destinationUrl.toString(), contactEmail, category,
    });
    return Response.json({ listing }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE')) return Response.json({ error: 'duplicate_handle' }, { status: 409 });
    return Response.json({ error: 'submission_failed' }, { status: 500 });
  }
}
