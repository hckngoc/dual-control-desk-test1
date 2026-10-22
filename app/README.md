# Dual-Control Expense Desk — Tide application

RMIT Hackathon 2026, Challenge 2 · **RMIT_SGS_N3T_C2**

This is the existing Next.js application, extended from the Tide customer-portal template. Start at the [root README](../README.md) and [Tide setup guide](../docs/TIDE_SETUP_VI.md).

## Source checks and startup

Node.js 22.18+:

```powershell
npm ci
npm test
npm run build
npm run typecheck
npm run dev
```

Open http://localhost:3000/expenses. The root URL redirects there. The retained customer API example is at /dashboard and also uses strict DPoP.

No adapter is required for a build. The browser fetches /api/config before mounting the SDK; missing/invalid configuration returns 503 with an operator diagnostic. Authentication does not fall back to a demo identity.

## Use an existing Tide realm

Export a real **public-client** Tide adapter to ignored `data/tidecloak.json`, or put complete JSON in server-only `CLIENT_ADAPTER`. Public embedded JWKS and Tide vendor/ORK settings are required. Credential-bearing exports and private keys are rejected. /api/config exposes allowlisted public connection settings; it never returns the raw configuration.

Configure the client access-token audience, redirect URLs, DPoP-bound tokens and required expense realm roles. See [.env.example](.env.example) for deployment settings. Keep secrets, the adapter and H2 state out of Git.

## New local realm — operator only

Do not use `npm run init` as a routine startup command. It creates Docker/realm/licensing state and asks for account linking. An operator must review the script, provide their own license email and personally accept terms. It requires explicit `TIDE_BOOTSTRAP_FRESH=yes` and refuses an existing tidecloak container, adapter or local H2 database. It does not stop/remove containers or erase existing data.

No realm initialization was performed during repository hardening.

## Validation boundaries

`npm test` exercises actual API handlers with isolated in-memory signing fixtures. It proves regression behavior, not real Tide login or MultiAdmin governance. A configured realm, independent accounts and manual evidence are still required. Expenses, audits and DPoP replay state are process-local; use one server process for this prototype.
