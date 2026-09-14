# Verdict Engine — Progress & Decision Log (P1)

Owner: P1 (Verdict Engine / Security Logic)
Branch: `feature/p1-verdict-engine`
Last updated: _(update this line each session)_

Keep this updated as you go — it's the record P2 will read before wiring your function into `/trust/evaluate`, and it's your own memory of *why* you made each call.

---

## Status at a glance

| Step | Description | Status |
|---|---|---|
| 1 | Lock shared types with team | ⬜ Not started |
| 2 | Write test matrix (failing tests) | ⬜ Not started |
| 3 | Implement Rules 1–3 (identity, capability, reputation) | ⬜ Not started |
| 4 | Implement Rule 4 (limit + review threshold) | ⬜ Not started |
| 5 | Implement Rule 5 (unknown recipient / anomalous amount) | ⬜ Not started |
| 6 | Build `categorizeForDocket()` | ⬜ Not started |
| 7 | Full test suite + edge cases | ⬜ Not started |
| 8 | Handoff to P2 | ⬜ Not started |

Update to 🟡 In progress / ✅ Done as you go.

---

## Decisions log

Record any choice that isn't 100% spelled out in the spec, or anywhere you deviated and why.

- _(example) Used `>=` not `>` for the hard limit comparison — chose to REJECT exactly-at-limit amounts, confirm with team if this should be ALLOW instead._

---

## Shared types agreed (Step 1)

Paste the final agreed shape of `Agent`, `ActionRequestInput`, and `EvaluateResult` here once locked with the team.

```ts
// paste from packages/shared/types.ts once finalized
```

---

## Test matrix results (Step 2 & 7)

| # | Scenario | Expected | Passing? |
|---|---|---|---|
| 1 | Verified agent + valid amount | ALLOW | ⬜ |
| 2 | Unverified agent | REJECT | ⬜ |
| 3 | Missing capability | REJECT | ⬜ |
| 4 | Amount above hard limit | REJECT | ⬜ |
| 5 | Borderline amount | REVIEW | ⬜ |
| 6 | Unknown recipient | REVIEW | ⬜ |
| 7 | Recent reputation flag | REJECT | ⬜ |

---

## Open questions / blockers

- _(list anything you need from the team here)_

---

## Handoff notes for P2 (fill in at Step 8)

- Final function signature:
- Any assumptions P2 should know about:
- Known edge cases not covered:
