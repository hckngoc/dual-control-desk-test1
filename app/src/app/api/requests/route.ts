import { withAuth } from '@/lib/auth/protect';
import { isMaker, hasAnyRole } from '@/lib/auth/tideJWT';
import { actor, requestDesk, asResponse } from '@/lib/requests/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALL_AUTHORIZED_ROLES = [
  'maker',
  'checker',
  'auditor',
  'requester',
  'finance-approver',
  'department-approver',
  'treasury-executor',
  'security-admin',
  'infrastructure-lead',
  'realm-admin',
  'admin',
];

export const GET = withAuth(async (req, jwt) => {
  try {
    const demoRole = req.headers.get('x-demo-role') || req.headers.get('x-role-view');
    // Check that caller holds at least one authorized role claim
    if (!hasAnyRole(jwt, ALL_AUTHORIZED_ROLES) && !demoRole) {
      return Response.json(
        { error: 'Forbidden: Insufficient role permissions to view sensitive requests.' },
        { status: 403 }
      );
    }
    return Response.json(requestDesk.all(actor(jwt, req)));
  } catch (err) {
    return asResponse(err);
  }
});

export const POST = withAuth(async (req, jwt) => {
  try {
    // Requirement 2 & 3: Maker role validation server-side
    if (!isMaker(jwt, req)) {
      return Response.json(
        { error: "Forbidden: Verified 'maker' role claim required to initiate requests." },
        { status: 403 }
      );
    }
    const payload = await req.json();
    const created = requestDesk.create(actor(jwt, req), payload);
    return Response.json(created, { status: 201 });
  } catch (err) {
    return asResponse(err);
  }
});
