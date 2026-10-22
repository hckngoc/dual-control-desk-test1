import { withAuth } from '@/lib/auth/protect';
import { isChecker } from '@/lib/auth/tideJWT';
import { actor, requestDesk, asResponse } from '@/lib/requests/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const extractRequestId = (req: Request) => {
  const match = new URL(req.url).pathname.match(/^\/api\/requests\/(REQ-\d+)\/approve$/);
  if (!match) throw new Error('Invalid request approval route format');
  return match[1];
};

export const POST = withAuth(async (req, jwt) => {
  try {
    // Requirement 2 & 3: Checker role validation server-side
    if (!isChecker(jwt)) {
      return Response.json(
        { error: "Forbidden: Verified 'checker' role claim required to review and approve requests." },
        { status: 403 }
      );
    }

    const id = extractRequestId(req);
    const body = await req.json().catch(() => ({}));
    const updated = requestDesk.approve(actor(jwt), id, body);
    return Response.json(updated);
  } catch (err) {
    return asResponse(err);
  }
});
