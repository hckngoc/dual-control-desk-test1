import { withAuth } from '@/lib/auth/protect';
import { hasRole } from '@/lib/auth/tideJWT';
import { actor, desk, asResponse } from '@/lib/expense/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const expenseId = (req: Request) => {
  const match = new URL(req.url).pathname.match(/^\/api\/expenses\/(EXP-\d+)\/approve$/);
  if (!match) throw new Error('Invalid expense approval route');
  return match[1];
};

export const POST = withAuth(async (req, jwt) => {
  try {
    const body = await req.json();
    const role = String(body?.role || '').trim();

    if (role !== 'finance-approver' && role !== 'department-approver') {
      return Response.json(
        { error: "Invalid role specified. Must be 'finance-approver' or 'department-approver'" },
        { status: 400 }
      );
    }

    // Critical Rule 4: Verify role claim on verified JWT
    if (!hasRole(jwt, role)) {
      return Response.json(
        { error: `Forbidden: Verified '${role}' role claim required to execute this approval` },
        { status: 403 }
      );
    }

    return Response.json(desk.approve(actor(jwt), expenseId(req), role));
  } catch (e) {
    return asResponse(e);
  }
});
