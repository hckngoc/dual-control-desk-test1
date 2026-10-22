import { withAuth } from '@/lib/auth/protect';
import { actor } from '@/lib/expense/store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withAuth(async (_req, jwt) => Response.json(actor(jwt)));
