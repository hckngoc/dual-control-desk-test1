# Repository hardening verification — 22 October 2026

## A. Executive summary

The existing Dual-Control Expense Desk was hardened on **feat/challenge2-hardening-thinh**, in the verified hckngoc/dual-control-desk workspace. The build no longer imports a missing local adapter. Runtime configuration fails closed, JWT/DPoP checks remain mandatory, business validation and auditing are stronger, and the product/setup/submission documentation now matches this existing application.

This report distinguishes executed source checks from live Tide acceptance. **Submission remains incomplete:** no real adapter/realm session or MultiAdmin evidence was available, and demo.mp4 is absent.

## B. Implemented and verified

- **P0:** Removed the compile-time adapter import using the installed SDK's supported config object. Providers fetches /api/config first; the route validates and allowlists real public-client settings. Missing or malformed configuration returns 503. A missing-adapter production build succeeds without dummy keys/configuration.
- **P0:** JWT verification now requires an asymmetric signature, exact issuer, application audience, authorized client, subject, expiry and issue time. Expense authorization uses only verified realm roles.
- **P1:** Strict ES256 DPoP validates proof signature/key, token binding/hash, URL, exact method, time and replay. Forwarded headers need explicit operator trust. Future-dated proof IDs stay cached through the complete acceptance window.
- **P1:** Strict object/title/numeric amount validation rejects coercion and sub-cent amounts that round to zero. JSON/media/body-size failures return 400/415/413. Invalid expense routes return 404.
- **P1:** Retained the $10,000 dual-approval threshold, distinct subjects, independent executor, one-time mock settlement and 403/409 behavior. Actual API-handler tests cover concurrent duplicate approvals and confirm only one succeeds.
- **P1:** Approval attempts and business-rule rejections are audited without mutating expense state. Handler errors are not relabeled as authentication failures.
- **P2:** UI presents server-verified identity and roles, approval categories/progress, statuses, clear permission reasons, loading/empty/error states, focus styles and mock-settlement limits. The retained dashboard now uses secureFetch. Root navigation is a routing-level 307 to /expenses; callback returns are limited to the same origin.
- **P2:** Bootstrap no longer stops/removes the existing container or deletes database files. It refuses existing Tide state and requires explicit fresh-setup opt-in. Its syntax was checked; it was not executed.
- **P2:** CI now runs root/app tests and a missing-adapter build. Its hygiene check permits .env.example while rejecting local secrets/generated paths. Canonical engine and overlay consistency are checked.
- **P2:** README, Vietnamese setup/team/test guides, architecture/security boundaries and the two-minute video script/checklist were updated.
- **P3:** Database, shared replay store, payment integration, deployment and larger redesign were deliberately deferred.

Baseline: all 18 original tests passed after leaving the localhost-restricted sandbox. The original TypeScript missing-module error was reproduced before changes.

## C. Implemented but not fully exercised

The authenticated browser interface, live login/logout/callback, realm-specific audience/role settings, proxy deployment and Tide iframe/CSP compatibility need a real adapter and live users. API-handler fixtures exercise security and workflow code but do not exercise the Tide network. The missing-config browser screen was inspected visually and its text/accessibility tree confirmed.

Bootstrap changes received Bash syntax checks and source inspection only. No Docker, WSL, licensing, initialization, account linking, terms acceptance, OS installation or global package changes were performed.

The GitHub Actions workflow was inspected and equivalent local commands passed; the hosted CI run was not observed during this report.

## D. Blocked by TideCloak environment

app/data/tidecloak.json is absent and no real realm adapter was supplied through CLIENT_ADAPTER. The actual installed versions were inspected: @tidecloak/nextjs 0.14.17, @tidecloak/react 0.14.33, @tidecloak/js 0.14.41, Next.js 16.4.2. The Next wrapper accepts config and does not forward configUrl; the implementation fetches the adapter before mounting it.

**BLOCKED:** real Tide login/logout, sender-constrained token issuance, four real-user workflow and IGA/MultiAdmin role-grant demonstration. MultiAdmin additionally requires the actual application realm, Tide-backed governance mode, independent administrators, threshold >=2, actual pending/approval/commit state and fresh verified token roles. Login and business approvals alone prove none of that.

Upstream reference: [Tide SDK repository](https://github.com/tide-foundation/tidecloak-js). The [official challenge sample](https://github.com/truongnguyenxuanvinh/hackathon) was inspected for its five-part storytelling structure and video artifact convention, not used as a source of credentials or setup shortcuts.

## E. Testing results

Executed on Windows with Node **v25.9.0**. CI is configured for Node 22.18.0; that exact runtime was not locally executed.

| Location / exact command | Actual result |
|---|---|
| Root: npm test | **PASS**, 21 tests (20 business unit tests + simulator HTTP flow) |
| Root: npm run check | **PASS**, canonical engine, overlay equality and tracked-path hygiene |
| app: npm ci --no-audit --no-fund | **PASS**, 36 locked packages installed in the project |
| app: npm test | **PASS**, 9 runner entries: 8 security/workflow subtests plus parent; isolated in-memory signing fixtures |
| app: npm run build | **PASS**, Next.js 16.4.2 webpack production build, no adapter present |
| app: npm run typecheck | **PASS**, tsc --noEmit |
| app: npm run start -- --hostname 127.0.0.1 --port 3100 | **PASS**, built app started for runtime checks |
| app: node test/smoke.mjs http://127.0.0.1:3100 | **PASS**, 9 HTTP checks: config 503, four protected APIs 401 even with x-demo-user, three pages 200, root 307 /expenses |
| Git Bash: bash -n app/scripts/init-tidecloak.sh | **PASS**, syntax only |
| Git Bash: bash -n scripts/setup-tide.sh | **PASS**, syntax only |
| Root: git diff --check | **PASS** after line-ending normalization |
| Targeted private-key/GitHub-token/AWS-key/private-JWK pattern scan | **PASS**, zero matches in tracked working files and both existing commits; not a comprehensive secret scanner |
| Browser: http://127.0.0.1:3100/expenses | **PASS**, rendered missing-config diagnostic and Retry configuration control |
| Real Tide authentication + MultiAdmin | **BLOCKED**, no real realm configuration |
| Authenticated browser workflow / deployment CSP / proxy | **NOT TESTED** against live Tide |
| Recorded demo.mp4 | **NOT TESTED**, file does not exist |

Earlier attempts were accurately distinguished:
- **FAIL (environment):** sandbox npm test could not connect to its localhost HTTP server (EACCES); unrestricted rerun passed.
- **FAIL (environment):** sandbox npm ci ended with npm's exit-handler error; unrestricted locked reinstall passed.
- **FAIL (environment):** sandbox build hit EPERM on generated output; unrestricted builds passed.
- **FAIL (environment):** sandbox Git Bash initialization was denied; unrestricted syntax checks passed.
- **FAIL (environment):** a smoke client outside the sandbox could not reach the isolated server; moving the temporary server outside resolved connectivity.
- **FAIL (source, fixed):** initial runtime smoke found / returned streamed 200 instead of 307; routing configuration was corrected and the unchanged assertion then passed.

The app tests print Node's MODULE_TYPELESS_PACKAGE_JSON warning under native TypeScript loading. No check was disabled to hide it, and it does not occur as a build failure.

## F. Modified files

The complete intended file list and reasons follows below. The pre-existing app/public/silent-check-sso.html local change was preserved and excluded from staging. The generated next-env.d.ts change was returned to its original content after the build; it is not part of the delivery.

## G. Challenge 2 submission readiness

| Item | Assessment |
|---|---|
| Source code | **VERIFIED** by tests, typecheck and build within prototype scope |
| README and team identifier | **VERIFIED**, RMIT Hackathon 2026 — Challenge 2 / RMIT_SGS_N3T_C2 |
| Business workflow | **VERIFIED** with engine, simulator HTTP and actual API-handler fixtures; live Tide users remain blocked |
| Security | **VERIFIED** for documented automated checks; **INCOMPLETE** for production use |
| Automated tests/build | **VERIFIED** locally; hosted CI not observed |
| TideCloak / MultiAdmin | **BLOCKED** pending real realm/operator evidence |
| Demo video | **INCOMPLETE**, real demo.mp4 required |
| Final GitHub submission contents | **INCOMPLETE** until team review, live evidence and real video are incorporated into the submitted revision |

## H. Git delivery

Only the existing feat/challenge2-hardening-thinh branch is authorized. No new branch, main checkout/merge, history rewrite, force push or destructive cleanup was performed. The exact delivery commit and remote push result are reported in the final handover; this report is committed as part of that delivery. No PR was requested or required.

## I. Essential human actions

1. Supply the real public-client adapter for the existing application realm; verify audience, DPoP, login/logout and four independent-role user flow.
2. Verify actual Tide-backed MultiAdmin threshold and role-grant pending/approval/commit evidence.
3. Record and review demo.mp4, then commit the actual video to the submitted repository.
4. Confirm member attribution, review the feature branch and choose the submitted/default-branch revision through the team's review process.

Residual limits: memory-only records/replay/audit, no tenant isolation, no real payments, no immutable audit, no production hardening guarantee. A successful build is separate from successful Tide integration.

## Complete intended file inventory

| File | Reason |
|---|---|
| [.gitattributes](../.gitattributes) | Checks, scripts, line endings, dependency commands or secret hygiene |
| [.github/workflows/tests.yml](../.github/workflows/tests.yml) | Checks, scripts, line endings, dependency commands or secret hygiene |
| [.gitignore](../.gitignore) | Checks, scripts, line endings, dependency commands or secret hygiene |
| [app/.env.example](../app/.env.example) | Checks, scripts, line endings, dependency commands or secret hygiene |
| [app/next.config.ts](../app/next.config.ts) | Checks, scripts, line endings, dependency commands or secret hygiene |
| [app/package.json](../app/package.json) | Checks, scripts, line endings, dependency commands or secret hygiene |
| [app/README.md](../app/README.md) | Accurate setup, security, testing or submission handover |
| [app/scripts/init-tidecloak.sh](../app/scripts/init-tidecloak.sh) | Refuse destructive reinitialization; explicit fresh opt-in |
| [app/src/app/api/config/route.ts](../app/src/app/api/config/route.ts) | Validated runtime configuration and JWT/DPoP enforcement |
| [app/src/app/api/expenses/[id]/approve/route.ts](../app/src/app/api/expenses/[id]/approve/route.ts) | Protected API status/identity handling |
| [app/src/app/api/expenses/[id]/execute/route.ts](../app/src/app/api/expenses/[id]/execute/route.ts) | Protected API status/identity handling |
| [app/src/app/api/expenses/route.ts](../app/src/app/api/expenses/route.ts) | Protected API status/identity handling |
| [app/src/app/api/whoami/route.ts](../app/src/app/api/whoami/route.ts) | Protected API status/identity handling |
| [app/src/app/auth/redirect/page.tsx](../app/src/app/auth/redirect/page.tsx) | Product navigation, identity display, state and accessibility |
| [app/src/app/dashboard/page.tsx](../app/src/app/dashboard/page.tsx) | Product navigation, identity display, state and accessibility |
| [app/src/app/expenses/expense.css](../app/src/app/expenses/expense.css) | Product navigation, identity display, state and accessibility |
| [app/src/app/expenses/page.tsx](../app/src/app/expenses/page.tsx) | Product navigation, identity display, state and accessibility |
| [app/src/app/layout.tsx](../app/src/app/layout.tsx) | Product navigation, identity display, state and accessibility |
| [app/src/app/page.tsx](../app/src/app/page.tsx) | Product navigation, identity display, state and accessibility |
| [app/src/app/providers.tsx](../app/src/app/providers.tsx) | Validated runtime configuration and JWT/DPoP enforcement |
| [app/src/lib/auth/protect.ts](../app/src/lib/auth/protect.ts) | Validated runtime configuration and JWT/DPoP enforcement |
| [app/src/lib/auth/tidecloakConfig.ts](../app/src/lib/auth/tidecloakConfig.ts) | Validated runtime configuration and JWT/DPoP enforcement |
| [app/src/lib/auth/tideJWT.ts](../app/src/lib/auth/tideJWT.ts) | Validated runtime configuration and JWT/DPoP enforcement |
| [app/src/lib/auth/verifyDpop.ts](../app/src/lib/auth/verifyDpop.ts) | Validated runtime configuration and JWT/DPoP enforcement |
| [app/src/lib/expense/engine.mjs](../app/src/lib/expense/engine.mjs) | Strict business validation, identity, audit and payload handling |
| [app/src/lib/expense/store.ts](../app/src/lib/expense/store.ts) | Strict business validation, identity, audit and payload handling |
| [app/test/api.test.mjs](../app/test/api.test.mjs) | Regression or runtime smoke coverage |
| [app/test/register.mjs](../app/test/register.mjs) | Regression or runtime smoke coverage |
| [app/test/smoke.mjs](../app/test/smoke.mjs) | Regression or runtime smoke coverage |
| [core/engine.mjs](../core/engine.mjs) | Strict business validation, identity, audit and payload handling |
| [demo/server.mjs](../demo/server.mjs) | Reject malformed simulator payloads consistently |
| [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | Accurate setup, security, testing or submission handover |
| [docs/GITHUB_ISSUES.md](../docs/GITHUB_ISSUES.md) | Accurate setup, security, testing or submission handover |
| [docs/HARDENING_REPORT.md](../docs/HARDENING_REPORT.md) | Accurate setup, security, testing or submission handover |
| [docs/SECURITY.md](../docs/SECURITY.md) | Accurate setup, security, testing or submission handover |
| [docs/TEAM_GITHUB_VI.md](../docs/TEAM_GITHUB_VI.md) | Accurate setup, security, testing or submission handover |
| [docs/TEST_PLAN_VI.md](../docs/TEST_PLAN_VI.md) | Accurate setup, security, testing or submission handover |
| [docs/TIDE_SETUP_VI.md](../docs/TIDE_SETUP_VI.md) | Accurate setup, security, testing or submission handover |
| [docs/VIDEO_SCRIPT_EN.md](../docs/VIDEO_SCRIPT_EN.md) | Accurate setup, security, testing or submission handover |
| [package.json](../package.json) | Checks, scripts, line endings, dependency commands or secret hygiene |
| [README.md](../README.md) | Accurate setup, security, testing or submission handover |
| [scripts/check-repository.mjs](../scripts/check-repository.mjs) | Checks, scripts, line endings, dependency commands or secret hygiene |
| [test/engine.test.mjs](../test/engine.test.mjs) | Regression or runtime smoke coverage |
| [test/http.test.mjs](../test/http.test.mjs) | Regression or runtime smoke coverage |
| [tide-overlay/src/app/api/expenses/[id]/approve/route.ts](../tide-overlay/src/app/api/expenses/[id]/approve/route.ts) | Keep historical expense overlay aligned with app |
| [tide-overlay/src/app/api/expenses/[id]/execute/route.ts](../tide-overlay/src/app/api/expenses/[id]/execute/route.ts) | Keep historical expense overlay aligned with app |
| [tide-overlay/src/app/api/expenses/route.ts](../tide-overlay/src/app/api/expenses/route.ts) | Keep historical expense overlay aligned with app |
| [tide-overlay/src/app/api/whoami/route.ts](../tide-overlay/src/app/api/whoami/route.ts) | Keep historical expense overlay aligned with app |
| [tide-overlay/src/app/expenses/expense.css](../tide-overlay/src/app/expenses/expense.css) | Keep historical expense overlay aligned with app |
| [tide-overlay/src/app/expenses/page.tsx](../tide-overlay/src/app/expenses/page.tsx) | Keep historical expense overlay aligned with app |
| [tide-overlay/src/lib/expense/store.ts](../tide-overlay/src/lib/expense/store.ts) | Keep historical expense overlay aligned with app |
