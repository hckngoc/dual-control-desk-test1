import { withAuth } from '@/lib/auth/protect';
import { actor, desk, asResponse } from '@/lib/expense/store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withAuth(async (_req, jwt) => {
 try { return Response.json(desk.audit(actor(jwt))); }
 catch (e) { return asResponse(e); }
});
