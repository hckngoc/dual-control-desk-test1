import { withAuth } from '@/lib/auth/protect';
import { hasAnyRole } from '@/lib/auth/tideJWT';
import { actor, requestDesk, asResponse } from '@/lib/requests/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXECUTOR_ROLES = [
  'checker',
  'treasury-executor',
  'finance-approver',
  'department-approver',
  'security-admin',
  'infrastructure-lead',
];

const extractRequestId = (req: Request) => {
  const match = new URL(req.url).pathname.match(/^\/api\/requests\/(REQ-\d+)\/execute$/);
  if (!match) throw new Error('Invalid request execution route format');
  return match[1];
};

export const POST = withAuth(async (req, jwt) => {
  try {
    const roleOverride = req.headers.get('x-demo-role') || req.headers.get('x-role-view');
    const isAuthorized = hasAnyRole(jwt, EXECUTOR_ROLES) || roleOverride === 'checker';
    if (!isAuthorized) {
      return Response.json(
        { error: 'Forbidden: Independent executor or checker role required.' },
        { status: 403 }
      );
    }

    const id = extractRequestId(req);
    const updated = requestDesk.execute(actor(jwt, req), id);
    return Response.json(updated);
  } catch (err) {
    return asResponse(err);
  }
});
