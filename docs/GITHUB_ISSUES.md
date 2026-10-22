# GitHub Issues — paste one issue per teammate

Create each issue in GitHub → Issues → New issue. Assign the named owner and milestone. Add labels `security`, `backend`, `frontend`, `docs` as appropriate. Do not confuse the issue assignee with a real Tide account.

## Issue 1 — M1: Real TideCloak realm + multi-admin governance

**Owner:** M1. **Branch:** `feature/tide-infra`.

- [ ] `bash scripts/setup-tide.sh`, commit `app/` source excluding `.env`, adapter, local DB
- [ ] Operator supplies license email and personal agreement to https://tide.org/legal
- [ ] Bootstrap local Docker TideCloak and real Tide login
- [ ] Create linked Tide admin accounts; enforce Tide (`iga.attestor=tide`) MultiAdmin threshold at least 2
- [ ] Create/assign the four expense roles through governed changes
- [ ] Verify role grant to self is PENDING after only one admin and applied only after second admin's enclave approval
- [ ] `tide-doctor` shows RESULT: OK, share redacted evidence only

## Issue 2 — M2: Backend policies and protected API

**Owner:** M2. **Branch:** `feature/backend-rules`.

- [ ] Review `core/engine.mjs`; ensure no double-counting, no self-approval, separate executor
- [ ] Check every `app/src/app/api/*` route uses `withAuth` and Tide actor from verified JWT
- [ ] Run `npm test` and add regression tests for bug fixes
- [ ] Verify direct API unauthorized tests against real Tide sessions
- [ ] Review DPoP behavior and token verification; no app role assignment endpoint

## Issue 3 — M3: Frontend

**Owner:** M3. **Branch:** `feature/frontend-dashboard`.

- [ ] Improve `/expenses` page responsiveness and accessibility
- [ ] Display pending approval role steps and final settlement clearly
- [ ] Ensure each action uses Tide `secureFetch` not plain fetch
- [ ] Support errors for missing role, same user, no login, stale session
- [ ] Provide screenshots for README/demo

## Issue 4 — M4: QA + README + video

**Owner:** M4. **Branch:** `docs/demo-and-testing`.

- [ ] Run `docs/TEST_PLAN_VI.md` T01–T10 and R01–R12
- [ ] README Overview <=300 words with all five judging prompts
- [ ] Film `docs/VIDEO_SCRIPT_EN.md` into 2-minute `demo.mp4`
- [ ] Confirm public repo contains current app source, tests, script and video
- [ ] Confirm no email, token, password, Tide adapter in Git history
- [ ] Open public repo in incognito, verify demo instructions and submission link
