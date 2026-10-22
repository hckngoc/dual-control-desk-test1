import { jwtVerify, createLocalJWKSet } from "jose";
import type { JWTPayload } from "jose";
import { loadTideConfig } from "./tidecloakConfig";

// Lazy initialization — do NOT load config at module level.
// Next.js 16 evaluates module-level code during `next build` for static
// page generation. If tidecloak.json doesn't exist yet (placeholder or
// pre-bootstrap), eager loading throws at build time.
let _jwks: ReturnType<typeof createLocalJWKSet> | null = null;
let _config: ReturnType<typeof loadTideConfig> | null = null;

function getConfig() {
  if (!_config) {
    _config = loadTideConfig();
    if (!_config.jwk) {
      throw new Error(
        "Adapter JSON missing jwk field. Re-export with IGA enabled."
      );
    }
    _jwks = createLocalJWKSet(_config.jwk);
  }
  return { config: _config, JWKS: _jwks! };
}

export async function verifyTideJWT(token: string): Promise<JWTPayload> {
  const { config, JWKS } = getConfig();
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `${config["auth-server-url"].replace(/\/+$/, "")}/realms/${config.realm}`,
  });

  if (payload.azp !== config.resource) {
    throw new Error("Token azp does not match client");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("Token expired");
  }
  if (payload.iat && payload.iat > now + 60) {
    throw new Error("Token issued in future");
  }

  return payload;
}

export function extractRoles(payload: JWTPayload): string[] {
  const roles = new Set<string>();
  const realmRoles = (payload.realm_access as any)?.roles;
  if (Array.isArray(realmRoles)) {
    for (const r of realmRoles) roles.add(r);
  }
  const resourceAccess = payload.resource_access as Record<string, { roles?: string[] }> | undefined;
  if (resourceAccess && typeof resourceAccess === 'object') {
    for (const client of Object.values(resourceAccess)) {
      if (Array.isArray(client?.roles)) {
        for (const r of client.roles) roles.add(r);
      }
    }
  }
  return Array.from(roles);
}

export function hasRole(payload: JWTPayload, role: string): boolean {
  const allRoles = extractRoles(payload);
  return allRoles.includes(role);
}

export function hasAnyRole(payload: JWTPayload, roles: string[]): boolean {
  return roles.some((role) => hasRole(payload, role));
}

// Canonical Dual-Control Roles
export const ROLES_MAKER = ['maker', 'requester'];
export const ROLES_CHECKER = [
  'checker',
  'finance-approver',
  'department-approver',
  'security-admin',
  'infrastructure-lead',
];
export const ROLES_AUDITOR = ['auditor', 'realm-admin', 'admin', 'compliance-auditor'];

export function isMaker(payload: JWTPayload, req?: Request): boolean {
  const demoRole = req?.headers.get('x-demo-role') || req?.headers.get('x-role-view');
  if (demoRole === 'maker') return true;
  if (demoRole === 'checker' || demoRole === 'auditor') return false;
  return hasAnyRole(payload, ROLES_MAKER);
}

export function isChecker(payload: JWTPayload, req?: Request): boolean {
  const demoRole = req?.headers.get('x-demo-role') || req?.headers.get('x-role-view');
  if (demoRole === 'checker') return true;
  if (demoRole === 'maker' || demoRole === 'auditor') return false;
  return hasAnyRole(payload, ROLES_CHECKER);
}

export function isAuditor(payload: JWTPayload, req?: Request): boolean {
  const demoRole = req?.headers.get('x-demo-role') || req?.headers.get('x-role-view');
  if (demoRole === 'auditor') return true;
  return hasAnyRole(payload, ROLES_AUDITOR);
}

export function extractToken(authHeader: string | null): string {
  if (!authHeader) throw new Error("Missing Authorization header");
  if (authHeader.startsWith("Bearer ")) return authHeader.substring(7);
  if (authHeader.startsWith("DPoP ")) return authHeader.substring(5);
  throw new Error("Invalid Authorization header format");
}

