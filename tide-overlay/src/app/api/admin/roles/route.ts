import { withAuth } from '@/lib/auth/protect';
import { actor, desk } from '@/lib/expense/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withAuth(async (_req, jwt) => {
  const p = actor(jwt);
  // Log security event
  desk.event(
    'ROLE_CHANGE_BLOCKED',
    p.id,
    null,
    'Manage roles in TideCloak IGA; this application has no escalation API'
  );

  return Response.json(
    {
      error:
        'Forbidden: Direct role mutation is blocked. All privilege escalation and role assignments are exclusively governed through Tide MultiAdmin IGA consensus with multi-party enclave signing.',
      breachImmunity: true,
      governanceMode: 'Tide MultiAdmin (Enclave Attested)',
    },
    { status: 403 }
  );
});
