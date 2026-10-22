import { withAuth } from '@/lib/auth/protect';
import { actor } from '@/lib/expense/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req, jwt) => {
  const p = actor(jwt);
  return Response.json({
    sub: jwt.sub,
    username: jwt.preferred_username || jwt.sub,
    email: jwt.email,
    roles: p.roles,
    dpopBound: Boolean((jwt as { cnf?: { jkt?: string } })?.cnf?.jkt),
    keyThumbprint: (jwt as { cnf?: { jkt?: string } })?.cnf?.jkt,
  });
});
