"use client";

import { useEffect, useState } from "react";
import { TideCloakProvider, useTideCloak } from "@tidecloak/nextjs";
import "./expenses/expense.css";

function AuthStatus({ children }: { children: React.ReactNode }) {
  const { initError, isInitializing } = useTideCloak();
  if (initError) return <main className="expense-app"><section className="expense-panel" role="alert"><h1>TideCloak connection failed</h1><p>Check the realm, client redirect URLs and browser connection to TideCloak.</p><button onClick={() => window.location.reload()}>Retry connection</button></section></main>;
  if (isInitializing) return <main className="expense-app"><p role="status">Connecting to TideCloak…</p></main>;
  return children;
}
export function Providers({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/config", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load TideCloak configuration");
        // This SDK version's Next.js wrapper accepts config, not configUrl.
        setConfig({ ...body, useDPoP: { mode: "strict", alg: "ES256" } });
      })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Configuration unavailable"); });
    return () => controller.abort();
  }, []);
  if (error) return <main className="expense-app"><section className="expense-panel" role="alert"><h1>Dual-Control Expense Desk</h1><h2>TideCloak configuration required</h2><p>{error}</p><p>An operator must supply a real public-client adapter. Authentication remains required.</p><button onClick={() => window.location.reload()}>Retry configuration</button></section></main>;
  if (!config) return <main className="expense-app"><p role="status">Loading TideCloak configuration…</p></main>;
  return <TideCloakProvider config={config}><AuthStatus>{children}</AuthStatus></TideCloakProvider>;
}
