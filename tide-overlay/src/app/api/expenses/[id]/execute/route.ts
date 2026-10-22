import { withAuth } from '@/lib/auth/protect';
import { actor, desk, asResponse } from '@/lib/expense/store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withAuth(async (req, jwt) => {
  try {
    const match = new URL(req.url).pathname.match(/^\/api\/expenses\/(EXP-\d+)\/execute$/);
    if (!match) return Response.json({error:'Not found'}, {status:404});
    return Response.json(desk.execute(actor(jwt), match[1]));
  } catch (e) { return asResponse(e); }
});
