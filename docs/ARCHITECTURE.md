# Architecture and enforcement boundaries

```text
                         ┌──────────────────────────┐
                         │    Browser (real Tide)   │
                         │ TideCloak login; DPoP    │
                         └─────────────┬────────────┘
                                       │ secured request
                         ┌─────────────▼────────────┐
                         │ Next.js API              │
                         │ withAuth → JWT + DPoP    │
                         │ verified using adapter   │
                         └─────────────┬────────────┘
                                       │ actor(sub, roles)
                         ┌─────────────▼────────────┐
                         │ ExpenseDesk engine       │
                         │ distinct-role checks     │
                         │ status transitions       │
                         │ mock payment / audit     │
                         └──────────────────────────┘

     Admin A ─────┐     TideCloak IGA / Tide MultiAdmin      ┌── Admin B
                  └──→ governed approver role assignment ←───┘
                       no app role mutation endpoint
```

Real Tide integrations originate from `.tide-pack/templates/nextjs-customer-portal`, fetched unchanged, with Tide provider, auth redirect, DPoP relay, embedded JWKS and `withAuth` helpers. Expense-specific code is the overlay `tide-overlay/src/`. Identity is taken from the verified token `sub`; role authorization uses `realm_access.roles`. The demo always uses synthetic records.

**No master payment private key is protected by the prototype.** The app is not an implemented cryptocurrency wallet, bank rail, signed authorization contract or tamper-proof ledger. Tide's actual implemented protections relevant to the demo are authenticated identities and multi-admin governance of role changes when configured and verified.
