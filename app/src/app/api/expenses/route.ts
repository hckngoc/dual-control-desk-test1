import { withAuth } from '@/lib/auth/protect';
import { actor, desk, asResponse } from '@/lib/expense/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withAuth(async (_req, jwt) => {
  try { return Response.json(desk.all(actor(jwt))); }
  catch (e) { return asResponse(e); }
});
export const POST = withAuth(async (req, jwt) => {
  try {
    const payload = await req.json();
    return Response.json(desk.create(actor(jwt), payload), { status:201 });
  } catch (e) { return asResponse(e); }
});
