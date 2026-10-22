# Security, threat model & honest claims

## What Tide protects

- Login and signed token authorization without giving the app an identity-minting master key.
- Server-side token/role verification when official Tide template and embedded JWKS are used.
- DPoP binding to reject stolen bearer-token replay if configured/verified in the realm and app.
- Role/realm changes through QEA/IGA **only when Tide MultiAdmin attestor is actually configured with a multi-party threshold**, not in firstAdmin or simple/Tideless governance mode.

## What this prototype does NOT protect

- `npm run demo` trusts a selectable fake identity in `x-demo-user`: **never deploy** it.
- `app/` stores expenses in local process memory. App-server compromise, concurrent deployments, reboots and tampering are outside the protected integrity model. Audit events are non-immutable and not independently verifiable.
- Per-expense approvals are business-rule entries, **not Tide threshold-signed expense releases**. The final settlement is a mock, not a connected bank/payment rail.
- Admin capability over the runtime/hosting stack is not eliminated. A compromised server can deny service and can manipulate app-owned data, so do not claim cryptographically non-bypassable payment policy.
- Approval of role changes in the `master` realm is not proof of IGA in the application realm. Test real realm.
- Revoking a role prevents new permitted operations after token/session renewal and server-side policy checks. It cannot claw back data already viewed.

## Attack demonstration

1. A standard admin wants to add themselves as `finance-approver`.
2. No role-change endpoint exists in the expense application.
3. The admin files the change via TideCloak Admin Console.
4. In **Tide MultiAdmin** mode, the change stays PENDING until independent Tide enclave approval reaches threshold.
5. Without a committed role grant, the user's fresh Tide token does not contain the approver role and expense approval APIs reject them.
6. Once correctly approved, the authorized user can approve a finance step, but still cannot self-approve their own expense or count twice.

To cryptographically bind **the expense itself** to the approvals, future work should use a Tide-governed signing operation / policy contract that refuses signing until independent cryptographic conditions hold. Custom Forseti contracts require coordination with the Tide team and are NOT deployable by this template alone.
