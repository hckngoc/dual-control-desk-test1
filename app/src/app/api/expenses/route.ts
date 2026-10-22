import { withAuth } from '@/lib/auth/protect';
import { hasRole } from '@/lib/auth/tideJWT';
import { actor, desk, asResponse } from '@/lib/expense/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, jwt) => {
  try {
    return Response.json(desk.all(actor(jwt)));
  } catch (e) {
    return asResponse(e);
  }
});

export const POST = withAuth(async (req, jwt) => {
  try {
    // Critical Rule 4: Verify role claim 'requester' server-side
    if (!hasRole(jwt, 'requester')) {
      return Response.json(
        { error: "Forbidden: Verified 'requester' role claim required to initiate expense requests" },
        { status: 403 }
      );
    }
    const payload = await req.json();
    return Response.json(desk.create(actor(jwt), payload), { status: 201 });
  } catch (e) {
    return asResponse(e);
  }
});
