import { applyVerifiedTransaction, beginWebhookEvent, finishWebhookEvent } from '@/db/runtime';
import { normalizeTransaction, verifyBravopayWebhook } from '@/lib/bravopay';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('BravoPay-Signature') ?? request.headers.get('X-Bravopay-Signature');
  if (!(await verifyBravopayWebhook(rawBody, signature))) return Response.json({ error: 'invalid_signature' }, { status: 401 });
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }
  const eventId = String(event.id ?? '');
  const eventType = String(event.type ?? '');
  if (!/^evt_[A-Za-z0-9_-]+$/.test(eventId) || !/^transaction\./.test(eventType)) {
    return Response.json({ received: true });
  }
  const shouldProcess = await beginWebhookEvent(eventId, eventType);
  if (!shouldProcess) return Response.json({ received: true, duplicate: true });
  try {
    if (['transaction.paid', 'transaction.refunded', 'transaction.chargeback', 'transaction.expired', 'transaction.failed'].includes(eventType)) {
      await applyVerifiedTransaction(normalizeTransaction(event.data));
    }
    await finishWebhookEvent(eventId);
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: 'processing_failed' }, { status: 500 });
  }
}
