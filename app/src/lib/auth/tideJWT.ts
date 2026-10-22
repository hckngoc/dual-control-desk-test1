import { jwtVerify, createLocalJWKSet, type JWTPayload } from "jose";
import { loadTideConfig } from "./tidecloakConfig";

export async function verifyTideJWT(token: string): Promise<JWTPayload> {
  const config = loadTideConfig();
  const { payload } = await jwtVerify(token, createLocalJWKSet(config.jwk), {
    issuer: `${config["auth-server-url"]}/realms/${config.realm}`,
    audience: config.resource,
    algorithms: ["ES256", "ES384", "ES512", "EdDSA", "RS256", "PS256"],
    requiredClaims: ["sub", "exp", "iat", "azp", "aud"],
  });
  if (payload.azp !== config.resource) throw new Error("Token azp does not match client");
  if (typeof payload.sub !== "string" || !payload.sub.trim()) throw new Error("Token subject missing");
  if (typeof payload.iat !== "number" || payload.iat > Date.now() / 1000 + 60) throw new Error("Invalid token issue time");
  return payload;
}
export function realmRoles(payload: JWTPayload): string[] {
  const access = payload.realm_access as { roles?: unknown } | undefined;
  return Array.isArray(access?.roles) ? access.roles.filter((role): role is string => typeof role === "string") : [];
}
// Expense authority uses realm roles, never another client's roles.
export function hasRole(payload: JWTPayload, role: string): boolean { return realmRoles(payload).includes(role); }
export function extractToken(authHeader: string | null): string {
  const match = authHeader?.match(/^DPoP ([^\s]+)$/i);
  if (!match) throw new Error("A DPoP Authorization header is required");
  return match[1];
}
