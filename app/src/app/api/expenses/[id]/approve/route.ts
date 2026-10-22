import { withAuth } from '@/lib/auth/protect';
import { actor, desk, asResponse, readObject, expenseId } from '@/lib/expense/store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withAuth(async (req, jwt) => {
  try {
    const body = await readObject(req);
    return Response.json(desk.approve(actor(jwt), expenseId(req, 'approve'), body.role));
  } catch (e) { return asResponse(e); }
});
