import { withAuth } from '@/lib/auth/protect';
import { actor, desk, asResponse } from '@/lib/expense/store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Extract the route path rather than requiring a second handler `context` argument.
const expenseId = (req: Request) => {
  const match = new URL(req.url).pathname.match(/^\/api\/expenses\/(EXP-\d+)\/approve$/);
  if (!match) throw new Error('Invalid expense route');
  return match[1];
};
export const POST = withAuth(async (req, jwt) => {
  try {
    const body = await req.json();
    return Response.json(desk.approve(actor(jwt), expenseId(req), body.role));
  } catch (e) { return asResponse(e); }
});
