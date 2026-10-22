# Dual-Control Expense Desk

**RMIT Hackathon 2026 — Challenge 2**

**Team: RMIT_SGS_N3T_C2**

[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak)

## Product overview

Expense authorization with independent approvals and governed authority to become an approver. This is a working prototype with synthetic expenses and **mock settlement only**.

### 1. Vision & originality

Important spending should need independent review, including control over who gains approval authority.

### 2. Trust constraint insight

Two business approvals offer limited protection if one administrator can silently grant themselves both roles. Spending policy and identity governance address different trust boundaries.

### 3. Value & impact

A nonprofit can review a $25,000 supply purchase across Finance and Department, with an independent treasury executor and a readable audit trail.

### 4. Why TideCloak matters

TideCloak supplies real login, signed access tokens and realm roles. The API verifies JWTs and sender-constrained DPoP proofs. Tide MultiAdmin can govern role changes **when the realm, independent administrators and threshold are configured and verified**. Expense approvals themselves are application rules, not Tide-signed transactions.

### 5. Prototype & storytelling

Create an expense, demonstrate denied actions, collect the required distinct approvals, then record a mock settlement. Separately demonstrate a real governed role grant if available. Login alone and two expense approvals do not prove MultiAdmin.

## Features, roles and workflow

| Realm role | Application permission |
|---|---|
| requester | Create an expense with a purpose and USD amount |
| finance-approver | Finance approval for every expense |
| department-approver | Additional approval for expenses **≥ $10,000** |
| treasury-executor | Mock settle an approved expense |

A requester cannot self-approve. One verified token subject cannot satisfy two approval categories. The executor must differ from requester and all approvers. Repeated approvals and settlements are rejected. Lifecycle: **PENDING → APPROVED → SETTLED_MOCK**. Creation, approval attempts, business-rule rejections, approvals and settlement produce audit events.

## Architecture and tech stack

`Browser + Tide SDK → Next.js API (JWT + DPoP) → ExpenseDesk engine → process-memory expenses/audit`

Identity governance happens separately in the TideCloak Admin Console. The app has no role-grant API.

- `app/`: Next.js 16, React 19, TypeScript, `@tidecloak/nextjs@0.14.17`, jose.
- `core/`: dependency-free business engine; its identical app copy is checked automatically.
- `demo/`: local Node.js policy simulator with selectable fake identities.
- `tide-overlay/`: matching expense files retained for the historical template assembly.
- `test/`, `app/test/`: business, simulator HTTP and real API-handler regression tests.

See [architecture](docs/ARCHITECTURE.md) and [security](docs/SECURITY.md).

## Setup requirements

Use Node.js **22.18+** and npm for the full test/build workflow. No Docker, WSL, jq or Tide installation is required for source checks, the simulator or the build. Real sign-in requires a reachable, configured TideCloak realm and its authentic public-client adapter.

### Offline simulator — no Tide authentication

From the repository root:

```powershell
npm test
npm run demo
```

Open http://localhost:4173. Identity switching and `x-demo-user` are deliberately insecure simulation features. The simulator binds to loopback; never deploy it.

### Real Tide-connected application

The existing `app/` is the application source. **Do not rerun `scripts/setup-tide.sh`**; it refuses to overwrite this app.

```powershell
cd app
npm ci
npm test
npm run build
npm run typecheck
npm run dev
```

Open http://localhost:3000/expenses. With no adapter, the app shows a configuration diagnostic; protected APIs remain closed. A build passing without an adapter does **not** prove successful Tide integration.

For an **existing realm**, export the Tide public-client adapter to ignored `app/data/tidecloak.json`, or provide its complete JSON in server-only `CLIENT_ADAPTER` (for example via ignored `app/.env.local`). It needs public `jwk.keys`, `vendorId` and `homeOrkUrl`, alongside the realm, server URL, resource and `public-client: true`. The app loads validated public settings through `/api/config` at runtime. Set the client's redirect/web origins for localhost:3000 and its access-token audience to its own resource. Restart after environment changes.

For a **new realm**, an operator must review the [Tide setup guide](docs/TIDE_SETUP_VI.md), supply their own license details, personally accept terms and complete account linking. Bootstrap is a separate, explicit action; it refuses existing local Tide state. Do not initialize or wipe an existing realm to run the app.

## End-to-end walkthrough

1. Use four independent Tide identities with requester, Finance, Department and treasury roles.
2. Requester creates a $12,000 expense: PENDING, 0/2 approvals.
3. Demonstrate a direct API rejection for a requester without approval authority, or a self-approval attempt by a requester with Finance authority. Confirm state is unchanged and the rejection is audited.
4. Finance approves: PENDING, 1/2. A duplicate or the same subject attempting Department approval is rejected.
5. A different Department subject approves: APPROVED, 2/2.
6. An independent treasury user mock settles: SETTLED_MOCK. No payment is made; repeating execution returns 409.
7. Separately verify an IGA role grant stays pending after one admin and takes effect in a fresh token only after the configured independent approvals and commit. If unavailable, report it as unverified.

Disabled UI actions explain permission requirements; use the controlled direct-request checks in the [test plan](docs/TEST_PLAN_VI.md) for rejection evidence.

## Testing and verification

```powershell
# repository root
npm test
npm run check
# app directory
npm ci
npm test
npm run build
npm run typecheck
```

Root tests cover the engine and simulator HTTP flow. App tests exercise the actual route handlers with **isolated generated signing fixtures**, never a deployed fake adapter. They cover JWT/DPoP validation, roles, malformed input, concurrency, conflicts and audit. CI runs the same checks without Tide configuration. See [verification evidence](docs/HARDENING_REPORT.md) for executed outcomes and remaining blockers.

## Security scope and limitations

All protected real APIs authenticate server-side. Only verified realm roles authorize business actions; `x-demo-user` has no authority in `app/`. JWT verification checks signature, issuer, audience, authorized client, subject and time claims; strict DPoP checks the proof and token binding.

This is a **single-process prototype**. Expenses, audit and replay records are in memory, disappear on restart and cannot coordinate multiple servers. Authenticated realm users can read all synthetic expense/audit records. There is no tenant isolation, immutable ledger, payment rail or production availability guarantee. Role revocation takes effect as tokens renew; adapter key changes require a fresh export. Only enable proxy-header trust behind a controlled proxy. No production financial use is claimed.

## Video and team attribution

**Video: INCOMPLETE — `demo.mp4` has not been recorded or added.** The challenge requires a real video file in this repository. Follow the [two-minute script and recording checklist](docs/VIDEO_SCRIPT_EN.md). No placeholder video is provided.

Built collaboratively by **RMIT_SGS_N3T_C2**: Tide/operations, backend/security, frontend/UX and QA/storytelling. The Git history records contributions; individual member names should be confirmed by the team. [Team handover](docs/TEAM_GITHUB_VI.md).

The final submission is [this GitHub repository](https://github.com/hckngoc/dual-control-desk), with reviewed feature-branch changes incorporated by the team and the real video present.
