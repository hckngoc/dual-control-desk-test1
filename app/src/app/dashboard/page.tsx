"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import { useEffect, useState } from "react";

// Playbook: add-rbac-nextjs
// hasRealmRole() is UI gating only. The API enforces the real check.
export default function DashboardPage() {
  const { hasRealmRole, authenticated, secureFetch } = useTideCloak();
  const [customers, setCustomers] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated) return;
    secureFetch(new URL("/api/customers", window.location.origin).href)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => setCustomers(data.customers))
      .catch((err) => setError(err.message));
  }, [authenticated]);

  return (
    <div>
      <h1>Dashboard</h1>
      <a href="/expenses">Open Expense Desk</a>

      {/* UI gating: show admin section only if user has role */}
      {/* This does NOT protect the API. Server-side JWT verification does. */}
      {hasRealmRole("admin") && (
        <section>
          <h2>Admin Panel</h2>
          <p>Visible only to admins (UI gating). API still enforces role.</p>
        </section>
      )}

      <section>
        <h2>Customers</h2>
        {error && <p>Error: {error}</p>}
        {customers ? (
          <ul>
            {customers.map((c: any) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        ) : (
          <p>Loading...</p>
        )}
      </section>
    </div>
  );
}
