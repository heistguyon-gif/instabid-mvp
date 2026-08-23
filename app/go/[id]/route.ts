import { ensureDatabase } from '@/db/runtime';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = await ensureDatabase();
  const listing = await db.prepare("SELECT destination_url AS destinationUrl FROM listings WHERE id = ? AND status = 'active'")
    .bind(id).first<{ destinationUrl: string }>();
  if (!listing) return new Response('Not found', { status: 404 });
  await db.prepare('UPDATE listings SET click_count = click_count + 1 WHERE id = ?').bind(id).run();
  return Response.redirect(listing.destinationUrl, 302);
}
