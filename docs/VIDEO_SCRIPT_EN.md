# 2-minute demo video — script and shots (English)

Record `demo.mp4` locally and commit it to the public GitHub repo before submission. Avoid credentials, emails, tokens, or private admin UI data in screenshots. Use only synthetic examples.

| Time | Screen | Spoken script |
|---|---|---|
| 0:00–0:15 | Title + $25,000 expense | "Meet Dual-Control Expense Desk. High-value decisions deserve independent approvals, but traditional systems often let one administrator redefine who has authority." |
| 0:15–0:35 | App architecture mini diagram | "Employees submit expenses. Finance and Department review them independently. TideCloak handles real identities and makes approver-role changes governed rather than unilateral." |
| 0:35–0:55 | Create expense as requester; try self-approve and execute | "This request needs two distinct sign-offs. The requester is blocked from self-approval, and settlement is blocked until both roles have acted." |
| 0:55–1:15 | Finance approval; pending; Department approval; then mock execute | "Two separate approved users act. The expense becomes ready, then our treasury role records a mock settlement. No real payment moves." |
| 1:15–1:43 | **REAL TideCloak console**: admin attempts to grant themselves Finance role; remains pending; second admin approves through enclave | "But the important problem is one layer deeper: who controls the approvers? Here a single admin cannot make their own role grant effective. Tide MultiAdmin governance requires an independent authorized approval before the role takes effect." |
| 1:43–2:00 | Diagram + final banner | "TideCloak protects identity and governance. Our expense engine illustrates separation of duties. Together, they make high-value collaboration possible without trusting one administrator to control every decision." |

**If the actual Tide MultiAdmin admin-grant test is NOT verified, do not show the 1:15–1:43 outcome as fact.** Replace with a transparent 'in progress' status; do not submit it as a working governance demo.

### Recording

On Mac: press Shift + Command + 5 → Record Entire Screen/Selected Portion; or use OBS. Add voiceover. Trim to <=120s. Export H.264 MP4, verify video plays, and name it `demo.mp4`. Keep any Tide user email or admin credentials out of recording.
