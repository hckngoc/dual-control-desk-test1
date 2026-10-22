# Two-minute demo — RMIT_SGS_N3T_C2

**Artifact status: INCOMPLETE. No demo.mp4 exists yet.** Record actual application behavior and add the real file to the repository before submission.

| Time | Screen and narration |
|---|---|
| 0:00–0:15 | Title: “Dual-Control Expense Desk, RMIT_SGS_N3T_C2, RMIT Hackathon 2026 — Challenge 2. Two spending approvals mean little if one administrator controls who can approve.” |
| 0:15–0:30 | Expense Desk, signed-in identity and roles: “TideCloak authenticates users. Our app enforces distinct approval roles and an independent treasury executor.” |
| 0:30–0:47 | Requester submits a synthetic $12,000 cloud contract: “This needs Finance and Department approval. The request starts pending.” |
| 0:47–1:00 | Show a forbidden/self-approval attempt and unchanged state/audit. If UI prevents the action, state that explicitly; use a prepared real authenticated API request to show the server rejection. Do not call a disabled button server evidence. “This user cannot approve their own expense.” |
| 1:00–1:24 | Finance user approves, still pending; different Department user approves; treasury user mock settles: “Independent subjects complete the quorum. Treasury records a mock settlement. No real funds move.” |
| 1:24–1:48 | **Only when verified:** actual application-realm console, role grant pending after one admin, independent enclave approval, threshold/commit, then fresh token role and authorized action: “Approval authority itself is governed.” |
| 1:48–2:00 | Return to product and team identity: “Identity governance and expense policy address different trust boundaries. This prototype makes those boundaries visible.” |

If Tide login is unavailable, label every simulator shot **OFFLINE SIMULATOR — NO REAL TIDE AUTH** and say that real integration remains blocked. If MultiAdmin is unverified, replace that segment with an honest “MultiAdmin verification outstanding” statement. Such a recording still leaves the integration acceptance criterion incomplete. Never fabricate a pending grant or imply isolated signing fixtures are live Tide evidence.

## Prepare the recording

- Use the committed app revision and synthetic expense data. Warm up the real login flow.
- Prepare requester, Finance, Department and treasury in separate browser profiles/sessions so identities are visible and no session is confused.
- For self-approval evidence, the requester must also hold Finance through a legitimately approved role grant. For wrong-role evidence, use a requester-only subject. Prepare the direct call through the installed SDK's secureFetch in a controlled test harness; do not send an arbitrary username or plain Bearer token. A 401 caused by a missing proof is not a self-approval 403.
- Keep the HTTP status, unchanged expense and ACTION_REJECTED audit event visible for a real business-policy rejection.
- Confirm the real application realm, Tide-backed IGA, >=2 threshold, independent admins and actual pending/approved/committed state before making governance claims.
- Close terminals/notifications containing passwords, adapter JSON, email addresses, tokens or private admin information.

## Capture and export

Use an existing trusted screen recorder available to the team; no recording software was installed by this task. On Windows, the operator can use their existing screen-recording tool and microphone. Select the app window and readable resolution, add narration, and trim the result to about 120 seconds.

Export **H.264 video + AAC audio in an MP4 container** named demo.mp4 at the repository root. Play the complete exported file and check that its audio, text and all identity transitions are clear. Compress it below the repository host's ordinary file limit when practical; if using Git LFS, verify judges can retrieve/play the actual video.

Review the real file for secrets, commit it on the agreed feature branch, push it, and confirm it is accessible from the submitted repository. An external link or an empty MP4 does not satisfy the required in-repository video artifact.
