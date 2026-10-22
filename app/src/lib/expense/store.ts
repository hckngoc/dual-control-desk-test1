// Business decisions are independent of the Tide cryptographic identity layer.
// Import the copied, dependency-free engine from core/engine.mjs.
import { ExpenseDesk, RuleError } from './engine.mjs';
import type { JWTPayload } from 'jose';
import { realmRoles } from '../auth/tideJWT';

type BusinessDesk = InstanceType<typeof ExpenseDesk>;
const globalDesk = globalThis as unknown as { __dualControlDesk?: BusinessDesk };
// In-process state: safe for a single-process local hackathon demo only.
// Use transactional DB+audit storage before multi-instance deployment.
export const desk: BusinessDesk = globalDesk.__dualControlDesk ?? (globalDesk.__dualControlDesk = new ExpenseDesk());

export function actor(jwt: JWTPayload) {
  if (!jwt.sub) throw new RuleError('Token subject missing', 401);
  return {id: jwt.sub, name: String(jwt.preferred_username ?? jwt.sub), roles: realmRoles(jwt)};
}
export async function readObject(req: Request): Promise<Record<string, unknown>> {
  // Limit bytes while streaming; Content-Length alone is client-controlled.
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new RuleError('Content-Type must be application/json', 415);
  }
  const reader = req.body?.getReader();
  if (!reader) throw new RuleError('JSON object required', 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 10_000) { await reader.cancel(); throw new RuleError('Request too large', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let value: unknown;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new RuleError('Invalid JSON', 400); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RuleError('JSON object required', 400);
  return value as Record<string, unknown>;
}
export function expenseId(req: Request, action: 'approve' | 'execute'): string {
  const match = new URL(req.url).pathname.match(new RegExp(`^/api/expenses/(EXP-\\d+)/${action}$`));
  if (!match) throw new RuleError('Expense not found', 404);
  return match[1];
}
export function asResponse(error: unknown): Response {
  if (error instanceof RuleError) return Response.json({error: error.message}, {status:error.status});
  console.error('Expense API failure', error);
  return Response.json({error:'Internal error'}, {status:500});
}
