export async function POST() {
  return Response.json(
    { error: 'submissions_moved', message: 'Use o checkout Pix do ranking Brasil.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
