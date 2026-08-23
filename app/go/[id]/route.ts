import { getListingDestination } from '@/db/runtime';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const destinationUrl = await getListingDestination(id);
  if (!destinationUrl) return new Response('Not found', { status: 404 });
  return Response.redirect(destinationUrl, 302);
}
