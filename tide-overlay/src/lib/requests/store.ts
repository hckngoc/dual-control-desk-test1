import { RequestDesk, DualControlError } from './engine.mjs';
import type { JWTPayload } from 'jose';

type RequestDeskInstance = InstanceType<typeof RequestDesk>;

const globalDesk = globalThis as unknown as { __sensitiveRequestDesk?: RequestDeskInstance };

export const requestDesk: RequestDeskInstance =
  globalDesk.__sensitiveRequestDesk ?? (globalDesk.__sensitiveRequestDesk = new RequestDesk());

import { extractRoles } from '../auth/tideJWT';

export function actor(jwt: JWTPayload, req?: Request) {
  if (!jwt.sub) {
    throw new DualControlError('Token subject missing', 401, 'UNAUTHORIZED');
  }

  const cnf = (jwt as { cnf?: { jkt?: string } }).cnf;
  const extractedRoles = extractRoles(jwt);

  // Optional demo header support for single local browser testing during development
  const demoRole = req?.headers.get('x-demo-role') || req?.headers.get('x-role-view');
  const demoSub = req?.headers.get('x-demo-sub');
  const demoName = req?.headers.get('x-demo-name');

  const roles = [...extractedRoles];
  if (demoRole && !roles.includes(demoRole)) {
    roles.push(demoRole);
  }

  return {
    id: demoSub || jwt.sub,
    email: String(jwt.email || jwt.preferred_username || `${jwt.sub}@tide.internal`),
    name: demoName || String(jwt.preferred_username || jwt.sub),
    roles,
    dpopThumbprint: cnf?.jkt || '',
    dpopBound: Boolean(cnf?.jkt),
  };
}

export function asResponse(error: unknown): Response {
  if (error instanceof DualControlError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }
  console.error('Request API error:', error);
  return Response.json({ error: 'Internal Server Error' }, { status: 500 });
}

export { DualControlError };
