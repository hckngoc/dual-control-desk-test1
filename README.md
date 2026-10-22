[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project Overview

**Dual Control Desk** is an enterprise-grade, decentralized financial and operational governance platform built for **RMIT Hackathon 2026**. It enforces strict cryptographic **Maker-Checker Separation of Duties**, **RFC 9449 DPoP sender-constrained session management**, and **TideCloak MultiAdmin Fabric** authority protection.

- **Competition:** RMIT Hackathon 2026
- **Group:** RMIT_SGS_N3T_C2
- **Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, and TideCloak (`@tidecloak/nextjs`)
- **Built with:** [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)
- **Security Standards:** FIPS 140-3 HSM, RFC 9449 DPoP, Zero Master Key MultiAdmin Consensus

---

## Core Security & Dual-Control Architecture

### 1. Three Request Categories & Risk Governance
The desk governs critical operations where unilateral execution represents catastrophic blast-radius risk:
1. **Treasury Wire Transfer**: Amounts $\le \$10,000$ require single authorized approval; amounts $> \$10,000$ strictly require **Dual Control Quorum** (2-of-2 independent checker signatures).
2. **Production Firewall / IAM Policy Change**: High-Risk operational change requiring strict Dual Control Quorum.
3. **Emergency Database Key Rotation**: Critical-Risk HSM/database credential operation requiring strict Dual Control Quorum.

### 2. Strict Maker-Checker State Machine
- **State Flow**: `PENDING_QUORUM` $\rightarrow$ `APPROVED` $\rightarrow$ `EXECUTED` (or `REJECTED`).
- **Initiator Binding**: When a `maker` creates a request, immutable metadata (`makerId`, `makerEmail`, `createdAt`, `payload`) is anchored.
- **Separation of Duties**: If the logged-in user ID matches `makerId`, approval is unconditionally blocked with:
  > `403 Forbidden: Dual-Control Violation: Initiator cannot approve their own request.`
- **Quorum Integrity**: A single checker cannot approve twice in a quorum (`409 Conflict`).
- **Cryptographic Signatures**: Every approval attaches a verifiable signature proof containing the checker's DPoP key thumbprint and SHA-256 state digest.
- **Tamper-Evident Audit Trail**: Every state transition generates a SHA-256 chained block linked to the previous block hash (`verifyAuditIntegrity()`).

---

## Role-Based Access Control (RBAC) & Token Claims

Dual Control Desk enforces three primary roles extracted directly from TideCloak JWT token claims (`realm_access.roles` and `resource_access.*.roles`):

| Role | Permissions & Operational Scope | Token Claims |
| :--- | :--- | :--- |
| **`maker`** | Can initiate and submit sensitive operational requests (`POST /api/requests`). Blocked from approving or executing their own requests. | `maker`, `requester` |
| **`checker`** | Reviews, cryptographically signs/approves (`POST /api/requests/[id]/approve`), or rejects (`POST /api/requests/[id]/reject`) pending requests. | `checker`, `finance-approver`, `department-approver`, `security-admin`, `infrastructure-lead` |
| **`auditor`** | Read-only compliance access to the audit log (`GET /api/requests/audit`) and blast-radius security metrics. Blocked from creating or approving requests. | `auditor`, `compliance-auditor`, `realm-admin` |

---

## Protected Server Routes (`/api/requests/*`)

All server endpoints enforce server-side token validation via `withAuth`:
- **Unauthenticated calls** (missing token, invalid signature, expired token, or invalid RFC 9449 DPoP proof) immediately return `401 Unauthorized`.
- **Unauthorized calls** (insufficient or incorrect role claim) immediately return `403 Forbidden`.

| Endpoint | Method | Required Role | Enforcement |
| :--- | :--- | :--- | :--- |
| `/api/requests` | `GET` | `maker`, `checker`, `auditor` | Returns sensitive request telemetry for authorized actors. |
| `/api/requests` | `POST` | `maker` | Validates maker role claim; registers request in `PENDING_QUORUM`. |
| `/api/requests/[id]/approve` | `POST` | `checker` | Checks `checkerId !== makerId`; records cryptographic signature; checks quorum. |
| `/api/requests/[id]/reject` | `POST` | `checker` | Checks `checkerId !== makerId`; records formal rejection justification. |
| `/api/requests/[id]/execute` | `POST` | `checker` / executor | Checks `executorId !== makerId`; requires request to be in `APPROVED` status. |
| `/api/requests/audit` | `GET` | `auditor`, `checker`, `maker` | Returns chained audit logs and verifies SHA-256 cryptographic chain integrity. |

---

## Development & Multi-Account Testing Guide

### 1. Interactive Demo Role Switcher
In the top navigation bar, toggle between **Maker**, **Checker**, and **Auditor** viewpoints to instantly test UI permission gating and role scoping:
- **Maker View**: "New Request" modal is active. Maker cannot approve their own requests.
- **Checker View**: Review pending requests, cryptographically sign & approve, reject with reason, or execute approved actions.
- **Auditor View**: "New Request" is disabled with an "Auditor (Read-Only)" badge. Access to Audit Logs, chain verification, and blast-radius metrics is active.

### 2. Multi-Account Local Testing
To test true independent multi-party dual-control quorum while keeping real server-side JWT verification:
1. **Window 1 (Regular)**: Log in as `maker-user` to initiate a $25,000 Treasury Wire Transfer.
2. **Window 2 (Incognito / Second Profile)**: Log into TideCloak as `checker-user` to review and sign the request.
3. **Self-Approval Violation Test**: Attempt to approve your own request in Window 1 to witness the server-side `403 Dual-Control Violation` block and automatic logging to the audit chain.

---

## Getting Started

### 1. Run Automated Test Suite
```bash
npm test
```
Runs the 26 unit and integration tests covering the state machine, risk thresholds, separation of duties, and audit chain integrity.

### 2. Start the Development Server
```bash
cd app
npm run dev
```
Open [http://localhost:3000/expenses](http://localhost:3000/expenses) in your browser.

---

## RMIT Hackathon 2026 Submission
- **Repository:** [https://github.com/hckngoc/dual-control-desk](https://github.com/hckngoc/dual-control-desk)
- **Team:** RMIT_SGS_N3T_C2
- **Documentation:** See [`docs/TEST_PLAN_VI.md`](docs/TEST_PLAN_VI.md), [`docs/SECURITY.md`](docs/SECURITY.md), and [`docs/VIDEO_SCRIPT_EN.md`](docs/VIDEO_SCRIPT_EN.md).

