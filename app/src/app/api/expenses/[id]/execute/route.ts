import { withAuth } from '@/lib/auth/protect';
import { hasRole } from '@/lib/auth/tideJWT';
import { actor, desk, asResponse } from '@/lib/expense/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withAuth(async (req, jwt) => {
  try {
    const match = new URL(req.url).pathname.match(/^\/api\/expenses\/(EXP-\d+)\/execute$/);
    if (!match) return Response.json({ error: 'Not found' }, { status: 404 });

    // Critical Rule 4: Verify role claim on verified JWT
    if (!hasRole(jwt, 'treasury-executor')) {
      return Response.json(
        { error: "Forbidden: Verified 'treasury-executor' role claim required to execute settlement" },
        { status: 403 }
      );
    }

    return Response.json(desk.execute(actor(jwt), match[1]));
  } catch (e) {
    return asResponse(e);
  }
});
