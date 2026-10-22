import { loadTideConfig, TideConfigError } from "@/lib/auth/tidecloakConfig";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Public connection settings and public verification keys only.
export async function GET() {
  try {
    return Response.json(loadTideConfig(), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return Response.json(
      { error: err instanceof TideConfigError ? err.message : "TideCloak configuration unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
