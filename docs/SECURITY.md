# Security scope, checks and limitations

## What the implementation enforces

- Real protected APIs require a DPoP Authorization scheme, verified JWT signature against the adapter's public JWKS, exact issuer, application audience and authorized client (azp), nonempty subject, expiry and issue time.
- Accepted access-token algorithms are ES256/384/512, EdDSA, RS256 and PS256. Symmetric/unsigned token algorithms are excluded.
- DPoP requires an ES256 public P-256 proof key, dpop+jwt type, valid signature, cnf.jkt thumbprint, access-token hash (ath), URL without query/fragment, method, issue-time window and unused key-scoped jti. A bound token sent as Bearer is rejected.
- Forwarded host/protocol headers are untrusted by default. Enable TRUST_PROXY_HEADERS only when a controlled proxy replaces client-supplied forwarding headers. The in-memory replay cache retains future-dated proofs through their last accepted instant.
- Identity comparisons use the verified sub. Only realm_access.roles grants expense authority; another client's role and body-supplied identities/roles cannot grant it.
- Business policy forbids requester self-approval, one subject counting in both approval categories, duplicate categories, early settlement and requester/approver execution. Mock execution requires treasury-executor.
- JSON-object input has a 10,000-byte streaming limit in the real API, strict title/amount types and existing USD thresholds. Malformed JSON/values return 400, unsupported media 415, oversized payload 413, missing records 404, permission failures 403 and state conflicts 409.
- Missing credentials return 401 before loading configuration. An authenticated-looking request with unavailable adapter returns 503; valid token/proof failures return 401. Downstream business/server failures are not reclassified as authentication errors.
- /api/config is intentionally public: it serves allowlisted public-client settings and public JWKs with no-store. It rejects credential-bearing adapters and private keys. No raw parse errors, access tokens or admin credentials are returned.
- Creation, approval attempts, successful approvals, business-rule rejections and mock settlement are audited. Auth failures and malformed transport payloads are not persisted as business audit events.
- Same-origin post-login redirects prevent a stored external return URL from navigating away.

## What TideCloak supplies, subject to live verification

TideCloak supplies authentication and signed identity/role claims. Its configured DPoP client and realm issue sender-constrained tokens. IGA/MultiAdmin can govern role changes only with the correct realm, Tide-backed governance mode, independent admins, required threshold and committed change requests.

No live realm was available during hardening. Isolated signing fixtures verify this app's rejection behavior; they do not prove Tide network behavior, login, logout, CSP compatibility or MultiAdmin. The installed SDK and its config prop were inspected locally. See [Tide's SDK repository](https://github.com/tide-foundation/tidecloak-js) for upstream code.

## Explicit prototype limitations

- The offline simulator trusts selectable fake identities via x-demo-user. Never deploy it. The real application never uses that header for authority.
- All authenticated realm subjects can view every synthetic expense and audit record. No organizational/tenant isolation is implemented.
- Expenses, event log, IDs and DPoP replay records are process-local and unbounded. They vanish on restart and cannot coordinate replicas. Auth failure logging, rate limits, durable audit, abuse controls and production availability are not implemented.
- Within one process, rule checking and mutation are synchronous. Shared transactional storage is required before multiple processes or real financial workloads.
- The app server can manipulate app-owned data. Per-expense approval records are not Tide threshold signatures and audit events are not immutable.
- Mock settlement calls no payment system. No bank account, financial custody or payment key is protected.
- Tokens retain granted roles until they expire/refresh. A role revocation is not immediate revocation of already issued tokens or previously viewed data.
- Embedded realm keys need a fresh adapter export after key changes. The browser SDK still requires a valid realm, public origin/redirect configuration and compatible CSP. The existing permissive iframe policy is retained for Tide compatibility; a full deployment CSP review remains outstanding.
- A different Tide sub is not proof of a different human. Operator account governance matters.

## Governance demonstration

Use the actual application realm, never infer governance from master-realm operations. Record a protected role grant pending after one admin, the target's fresh token still lacking the role, independent enclave approvals reaching the configured threshold, the actual commit and a new verified token with the effective role. Do not count a pending signing response as completed approval.

No role-assignment bypass exists in the app. The simulator's denied /api/admin/roles demonstration is not proof of cryptographic governance.

## Secret hygiene

Ignore .env variants except the empty .env.example, generated adapters, private keys, SkyCloak API keys, H2 state, node_modules and build output. npm run check inspects tracked paths and source-copy consistency; it is not a comprehensive content or history secret scanner. Review staged content before committing. Removing a tracked secret does not remove historical exposure; remediation/rotation requires the team's explicit coordination.
