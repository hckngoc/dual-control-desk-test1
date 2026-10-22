[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project overview

**Dual-Control Expense Desk** is a synthetic high-value expense workflow that separates financial approvals and protects the authority to become an approver.

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality

Organizations should approve high-value spending across independent departments without granting any single administrator unilateral power to rewrite who can approve.

### 2. Trust constraint insight

Ordinary applications enforce two approvals but often let one super-admin grant themselves approval roles. Our design separates spending policy from identity governance so role escalation becomes a governed change.

### 3. Value & impact

A nonprofit could approve a $25,000 medical-supply purchase with both Finance and Department approval while preventing one administrator from silently taking over the process.

### 4. Why TideCloak matters

TideCloak supplies login, verified roles and, when configured in Tide MultiAdmin mode, cryptographically governed role grants via IGA. Application routes require valid Tide JWT/DPoP; administrators cannot change expense roles using an app bypass. **The per-expense approval rules and mock settlement remain application logic, not Tide-signed transactions.**

### 5. Prototype & storytelling

The demo creates an expense, rejects self-approval and missing-quorum execution, accepts two distinct eligible approvers, and records a mock settlement. The real Tide demo must also show a pending governed role grant that cannot be activated by one admin.

## Setup

**A. Offline policy simulator (no Tide and no real security):** Node.js 20+, `npm test`, then `npm run demo`; open http://localhost:4173. Select demo identities to try the workflows.

**B. Tide-connected Next.js app:** Follow [docs/TIDE_SETUP_VI.md](docs/TIDE_SETUP_VI.md). The official Tide Next.js template is retrieved by `bash scripts/setup-tide.sh`, then `app/` must be committed to this public repository (excluding secrets and local adapter). Run `npm run init` only after the operator supplies their own license email and explicitly accepts Tide's terms. The app then runs at http://localhost:3000/expenses.

See [team instructions](docs/TEAM_GITHUB_VI.md), [test plan](docs/TEST_PLAN_VI.md), [threat model](docs/SECURITY.md), and [two-minute video script](docs/VIDEO_SCRIPT_EN.md).

**Important:** The offline simulator uses selectable fake identities. Its `x-demo-user` header is deliberately insecure and must never be deployed. Tide runtime and MultiAdmin have to be independently verified in the team's environment. `demo.mp4` must be recorded and added before submission.
