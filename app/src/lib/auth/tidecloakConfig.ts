import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { JSONWebKeySet, JWK } from "jose";

export class TideConfigError extends Error {
  constructor(message: string) { super(message); this.name = "TideConfigError"; }
}
export interface TidecloakConfig {
  realm: string;
  "auth-server-url": string;
  resource: string;
  "public-client": true;
  "ssl-required"?: string;
  "confidential-port"?: number;
  jwk: JSONWebKeySet;
  vendorId: string;
  homeOrkUrl: string;
}
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
function serverUrl(value: unknown): value is string {
  if (!text(value)) return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password && !url.search && !url.hash &&
      (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)));
  } catch { return false; }
}
// Return an allowlist: public browser settings must never expose adapter credentials.
export function validateTideConfig(value: unknown): TidecloakConfig {
  if (!object(value) || !text(value.realm) || !/^[\w.-]+$/.test(value.realm) ||
      !text(value.resource) || !serverUrl(value["auth-server-url"])) {
    throw new TideConfigError("Adapter requires a realm, resource and HTTPS auth-server-url (HTTP is allowed on localhost).");
  }
  if (value["public-client"] !== true || value.credentials !== undefined) {
    throw new TideConfigError("Export a public-client adapter without credentials for the browser application.");
  }
  if (!object(value.jwk) || !Array.isArray(value.jwk.keys) || !value.jwk.keys.length ||
      !value.jwk.keys.every(key => object(key) && ["EC", "OKP", "RSA"].includes(String(key.kty)) &&
        !["d", "k", "p", "q", "dp", "dq", "qi", "oth"].some(field => field in key) &&
        (key.kty === "RSA" ? text(key.n) && text(key.e) : text(key.crv) && text(key.x) && (key.kty !== "EC" || text(key.y))))) {
    throw new TideConfigError("Adapter requires nonempty public jwk.keys. Export the Tide adapter with IGA enabled; private keys are forbidden.");
  }
  if (!text(value.vendorId) || !serverUrl(value.homeOrkUrl)) {
    throw new TideConfigError("Adapter requires Tide vendorId and homeOrkUrl. Re-export from the configured Tide realm.");
  }
  return {
    realm: value.realm, resource: value.resource, "auth-server-url": value["auth-server-url"].replace(/\/+$/, ""),
    "public-client": true, jwk: { keys: value.jwk.keys as JWK[] }, vendorId: value.vendorId, homeOrkUrl: value.homeOrkUrl,
    ...(typeof value["ssl-required"] === "string" ? { "ssl-required": value["ssl-required"] } : {}),
    ...(typeof value["confidential-port"] === "number" ? { "confidential-port": value["confidential-port"] } : {}),
  };
}
export function loadTideConfig(): TidecloakConfig {
  let raw: string;
  if (process.env.CLIENT_ADAPTER !== undefined) raw = process.env.CLIENT_ADAPTER;
  else {
    try { raw = readFileSync(join(process.cwd(), "data", "tidecloak.json"), "utf8"); }
    catch { throw new TideConfigError("TideCloak is not configured. Supply app/data/tidecloak.json or server-side CLIENT_ADAPTER from your real realm. See docs/TIDE_SETUP_VI.md."); }
  }
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new TideConfigError("Tide adapter is invalid JSON. Check the local file or server-side CLIENT_ADAPTER."); }
  return validateTideConfig(value);
}
