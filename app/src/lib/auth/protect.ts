import { NextRequest } from "next/server";
import { verifyTideJWT, hasRole, extractToken } from "./tideJWT";
import { verifyDpop } from "./verifyDpop";
import type { JWTPayload } from "jose";
import { TideConfigError } from "./tidecloakConfig";

// Playbook: verify-jwt-server-side Step 5
type AuthHandler = (req: NextRequest, jwt: JWTPayload) => Promise<Response>;

export function withAuth(handler: AuthHandler) {
  return async (req: NextRequest) => {
    let jwt: JWTPayload;
    try {
      const token = extractToken(req.headers.get("authorization"));
      jwt = await verifyTideJWT(token);
      // Require the JWT's cnf.jkt binding to the browser's proof; a signature alone is insufficient.
      await verifyDpop(req, token, jwt as { cnf?: { jkt?: string } }, {
        trustForwardedHeaders: process.env.TRUST_PROXY_HEADERS === "true",
      });
    } catch (err) {
      return Response.json(
        { error: err instanceof TideConfigError ? err.message : "Unauthorized: a valid Tide access token and fresh DPoP proof are required" },
        { status: err instanceof TideConfigError ? 503 : 401, headers: { "Cache-Control": "no-store" } }
      );
    }
    // Handler failures are not authentication failures.
    const response = await handler(req, jwt);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
}

export function withRole(role: string, handler: AuthHandler) {
  return withAuth(async (req, jwt) => {
    if (!hasRole(jwt, role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, jwt);
  });
}
