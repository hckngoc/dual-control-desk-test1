// Business decisions are independent of the Tide cryptographic identity layer.
// Import the copied, dependency-free engine from core/engine.mjs.
// @ts-ignore — the workshop engine is intentionally distributed as portable ESM.
import { ExpenseDesk, RuleError } from './engine.mjs';
import type { JWTPayload } from 'jose';

type BusinessDesk = InstanceType<typeof ExpenseDesk>;
const globalDesk = globalThis as unknown as { __dualControlDesk?: BusinessDesk };
// In-process state: safe for a single-process local hackathon demo only.
// Use transactional DB+audit storage before multi-instance deployment.
export const desk: BusinessDesk = globalDesk.__dualControlDesk ?? (globalDesk.__dualControlDesk = new ExpenseDesk());

export function actor(jwt: JWTPayload) {
  if (!jwt.sub) throw new RuleError('Token subject missing', 401);
  const access = jwt.realm_access as {roles?: string[]} | undefined;
  return {id: jwt.sub, name: String(jwt.preferred_username ?? jwt.sub), roles: Array.isArray(access?.roles) ? access!.roles! : []};
}
export function asResponse(error: unknown): Response {
  if (error instanceof RuleError) return Response.json({error: error.message}, {status:error.status});
  console.error('Expense API failure', error);
  return Response.json({error:'Internal error'}, {status:500});
}
