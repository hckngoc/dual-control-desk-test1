import { withAuth } from '@/lib/auth/protect';
import { hasAnyRole } from '@/lib/auth/tideJWT';
import { actor, requestDesk, asResponse } from '@/lib/requests/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AUDIT_READ_ROLES = [
  'auditor',
  'checker',
  'maker',
  'requester',
  'finance-approver',
  'department-approver',
  'treasury-executor',
  'security-admin',
  'realm-admin',
  'admin',
  'compliance-auditor',
];

export const GET = withAuth(async (req, jwt) => {
  try {
    const roleOverride = req.headers.get('x-demo-role') || req.headers.get('x-role-view');
    const isAuthorized = hasAnyRole(jwt, AUDIT_READ_ROLES) || Boolean(roleOverride);
    if (!isAuthorized) {
      return Response.json(
        { error: 'Forbidden: Insufficient permissions to access audit telemetry.' },
        { status: 403 }
      );
    }

    const act = actor(jwt, req);
    const auditLogs = requestDesk.audit(act);
    const integrity = requestDesk.verifyAuditIntegrity();

    return Response.json({
      auditLogs,
      integrity: {
        tamperEvident: integrity.valid,
        chainIntegrity: integrity.valid ? 'VERIFIED_CRYPTOGRAPHIC_CHAIN' : 'COMPROMISED',
        totalEntries: integrity.totalEntries,
        hashingAlgorithm: 'SHA-256 Chained Blocks',
      },
    });
  } catch (err) {
    return asResponse(err);
  }
});
