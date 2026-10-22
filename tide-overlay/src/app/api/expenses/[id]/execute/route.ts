import { withAuth } from '@/lib/auth/protect';
import { actor, desk, asResponse, expenseId } from '@/lib/expense/store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withAuth(async (req, jwt) => {
  try {
    return Response.json(desk.execute(actor(jwt), expenseId(req, 'execute')));
  } catch (e) { return asResponse(e); }
});
