import { createPendingListing } from '@/db/runtime';
import { isAllowedCategory, isAllowedListingContent, normalizeDestination, normalizeInstagramHandle } from '@/lib/validation';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const market = body.market === 'world' ? 'world' : body.market === 'br' ? 'br' : null;
  const name = String(body.name ?? '').trim().slice(0, 60);
  const handle = normalizeInstagramHandle(body.handle);
  const description = String(body.description ?? '').trim().slice(0, 220);
  const contactEmail = String(body.contactEmail ?? '').trim().toLowerCase().slice(0, 160);
  const category = String(body.category ?? '').trim().slice(0, 40);
  const destinationUrl = normalizeDestination(body.destinationUrl);
  const requestedBoostMinor = Math.round(Number(body.requestedBoostMinor));
  const minBoostMinor = market === 'world' ? 500 : 1900;

  if (!market || name.length < 2 || !handle || description.length < 12 || !destinationUrl ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || !isAllowedCategory(category) ||
      !Number.isSafeInteger(requestedBoostMinor) || requestedBoostMinor < minBoostMinor || requestedBoostMinor > 999_999_00 ||
      !isAllowedListingContent(name, description, destinationUrl)) {
    return Response.json({ error: 'invalid_fields' }, { status: 400 });
  }

  try {
    const listing = await createPendingListing({
      market, name, handle: handle.toLowerCase(), description,
      destinationUrl, contactEmail, category, requestedBoostMinor,
    });
    return Response.json({ listing }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE')) return Response.json({ error: 'duplicate_handle' }, { status: 409 });
    return Response.json({ error: 'submission_failed' }, { status: 500 });
  }
}
