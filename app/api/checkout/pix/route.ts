import { createBravopayPix, BravopayError, normalizeBuyer } from '@/lib/bravopay';
import { isAllowedCategory, isAllowedListingContent, normalizeDestination, normalizeInstagramHandle } from '@/lib/validation';
import {
  applyVerifiedTransaction,
  attachBravopayTransaction,
  createPaymentAttempt,
  getPayment,
  markPaymentFailed,
  prepareListingForPayment,
  consumeCheckoutRateLimit,
} from '@/db/runtime';

const json = (value: unknown, status = 200) => Response.json(value, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

function tracking(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const aliases: Record<string, string> = {
    utm_source: 'source', utm_medium: 'medium', utm_campaign: 'campaign', utm_content: 'content', utm_term: 'term',
    fbclid: 'fbclid', ttclid: 'ttclid', gclid: 'gclid', src: 'src', sck: 'sck',
  };
  return Object.fromEntries(Object.entries(aliases).flatMap(([inputKey, outputKey]) => {
    const item = String(source[inputKey] ?? '').trim().slice(0, 300);
    return item ? [[outputKey, item]] : [];
  }));
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const requestKey = String(body.idempotencyKey ?? '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) {
    return json({ error: 'invalid_request_key' }, 400);
  }
  const paymentId = `pay_${requestKey.replaceAll('-', '')}`;
  const buyer = normalizeBuyer(body.buyer);
  const name = String(body.name ?? '').trim().slice(0, 60);
  const handle = normalizeInstagramHandle(body.handle);
  const suppliedDescription = String(body.description ?? '').trim().slice(0, 220);
  const description = suppliedDescription.length >= 12
    ? suppliedDescription
    : `Conheça ${name || 'este projeto'} (${handle || '@instagram'}) no Instagram.`.slice(0, 220);
  const contactEmail = String(body.contactEmail ?? buyer?.email ?? '').trim().toLowerCase().slice(0, 160);
  const category = String(body.category ?? '').trim().slice(0, 40);
  const destinationUrl = normalizeDestination(body.destinationUrl || (handle ? `https://instagram.com/${handle.slice(1)}` : ''));
  const requestedBoostMinor = Math.round(Number(body.requestedBoostMinor));
  if (!buyer || name.length < 2 || !handle || description.length < 12 || !destinationUrl ||
      contactEmail !== buyer.email || !isAllowedCategory(category) || !Number.isSafeInteger(requestedBoostMinor) ||
      requestedBoostMinor < 1900 || requestedBoostMinor > 999_999_00 || !isAllowedListingContent(name, description, destinationUrl)) {
    return json({ error: 'invalid_fields' }, 400);
  }

  try {
    const visitorSource = `${request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown'}:${request.headers.get('user-agent') ?? ''}:${Math.floor(Date.now() / 600_000)}`;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(visitorSource));
    const visitorKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (!(await consumeCheckoutRateLimit(visitorKey))) return json({ error: 'rate_limited' }, 429);
    const previous = await getPayment(paymentId);
    if (previous?.pixCopyPaste && ['pending', 'confirmed'].includes(previous.status)) {
      return json({ payment: previous });
    }
    const listing = await prepareListingForPayment({
      market: 'br', name, handle: handle.toLowerCase(), description, destinationUrl,
      contactEmail, category, requestedBoostMinor,
    });
    const payment = await createPaymentAttempt({
      id: paymentId, listingId: listing.listingId, seasonId: listing.seasonId, amountMinor: requestedBoostMinor,
    });
    if (!payment || payment.listingId !== listing.listingId || payment.amountMinor !== requestedBoostMinor) {
      return json({ error: 'idempotency_conflict' }, 409);
    }
    const transaction = await createBravopayPix({
      paymentId,
      listingId: listing.listingId,
      seasonId: listing.seasonId,
      amountMinor: requestedBoostMinor,
      buyer,
      tracking: tracking(body.tracking),
    });
    let saved = await attachBravopayTransaction(paymentId, transaction);
    if (transaction.status === 'paid') saved = await applyVerifiedTransaction(transaction);
    return json({ payment: saved });
  } catch (error) {
    await markPaymentFailed(paymentId).catch(() => undefined);
    if (error instanceof BravopayError) {
      console.error('bravopay_checkout_error', { status: error.status, providerCode: error.providerCode, message: error.message });
      return json({ error: 'payment_provider_unavailable' }, error.status);
    }
    const message = error instanceof Error ? error.message : '';
    if (message.includes('duplicate_handle')) return json({ error: 'duplicate_handle' }, 409);
    if (message.includes('persistent_database_unavailable')) return json({ error: 'preview_only' }, 503);
    return json({ error: 'payment_creation_failed' }, 500);
  }
}
