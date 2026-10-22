# Architecture and enforcement boundaries

```text
Browser: runtime /api/config → TideCloakProvider (strict ES256 DPoP)
   │ real Tide login; secureFetch with access token + proof
   ▼
Next.js protected APIs
   JWT signature + iss/aud/azp/sub/exp/iat → DPoP binding/proof/replay
   │ verified token subject + realm roles
   ▼
ExpenseDesk: requester / distinct approvals / independent treasury
   │
Process memory: expenses, audit events; mock settlement only

Admin A + Admin B → actual TideCloak IGA / MultiAdmin → role grant
                    (requires separately configured/verified threshold)
```

## Configuration and identity

The existing app is maintained in app/, originally assembled from the Tide starter and tide-overlay/. The scaffold script is historical and refuses to overwrite app/. Build does not read a generated adapter. On browser mount, Providers fetches /api/config and passes a stable configuration object into the installed Next SDK wrapper. That wrapper accepts config; configUrl is not forwarded in 0.14.17.

The server reads server-only CLIENT_ADAPTER or data/tidecloak.json from the app working directory, validates it and returns only public allowlisted fields. Credential-bearing exports, private JWKs and missing Tide extensions are rejected with 503. There is no synthetic configuration or authentication fallback.

/api/whoami returns the subject, name and realm roles from the verified access token. All expense mutations enforce those roles in the business engine. The retained customer example at /dashboard uses secureFetch too. The callback restricts return navigation to the app origin.

## Code ownership and state

core/engine.mjs is canonical; app/src/lib/expense/engine.mjs is the identical portable copy. npm run check verifies equality and checks that tide-overlay expense files match app/. Update both copies when changing expense rules; no generated template should overwrite the app.

Mutations contain no asynchronous gap between rule checks and state updates, so duplicate actions serialize within one JavaScript process. Authentication runs asynchronously before entering that critical section. HTTP concurrency regression tests assert only one duplicate approval succeeds. This is not a cross-process transaction guarantee.

Expenses, audit records and the default DPoP replay store are memory-only. Run a single Next server process for the prototype. Restarts lose state; multiple replicas and development workers may diverge. Durable transactions, shared replay protection, pagination, tenant isolation and tamper-resistant audit are future work.

## Honest security boundary

Tide authenticates identities and can govern role grants when verified. App code owns expense rules and mock settlement. No payment private key, bank transfer, immutable ledger or cryptographically signed expense approval is implemented. The simulator trusts x-demo-user and demonstrates only policy behavior on loopback.
