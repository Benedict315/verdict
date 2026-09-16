# Verdict Engine — Progress & Decision Log (P1)

Owner: P1 (Verdict Engine / Security Logic)
Branch: `feature/p1-verdict-engine`
Last updated: 2026-09-16

Keep this updated as you go — it's the record P2 will read before wiring your function into `/trust/evaluate`, and it's your own memory of *why* you made each call.

---

## Status at a glance

| Step | Description | Status |
|---|---|---|
| 1 | Lock shared types with team | ✅ Done |
| 2 | Write test matrix (failing tests) | ✅ Done |
| 3 | Implement Rules 1–3 (identity, capability, reputation) | ✅ Done |
| 4 | Implement Rule 4 (limit + review threshold) | ✅ Done |
| 5 | Implement Rule 5 (unknown recipient / anomalous amount) | ✅ Done |
| 6 | Build `categorizeForDocket()` | ✅ Done |
| 7 | Full test suite + edge cases | ✅ Done |
| 8 | Handoff to P2 | ✅ Done |

Update to 🟡 In progress / ✅ Done as you go.

---

## Decisions log

Record any choice that isn't 100% spelled out in the spec, or anywhere you deviated and why.

- Rules evaluated in strict order (1 to 6) with first match winning.
- Result returns only `{ decision, reasons }` without populating `actionRequestId`, `authorizationToken`, or `docketMatches`.

---

## Shared types agreed (Step 1)

Paste the final agreed shape of `Agent`, `ActionRequestInput`, and `EvaluateResult` here once locked with the team.

```ts
import { Agent, ActionRequestInput, Decision, EvaluateResult } from '@verdict/shared';
```

---

## Test matrix results (Step 2 & 7)

| # | Scenario | Expected | Passing? |
|---|---|---|---|
| 1 | Verified agent + valid amount | ALLOW | ✅ |
| 2 | Unverified agent | REJECT | ✅ |
| 3 | Missing capability | REJECT | ✅ |
| 4 | Recent reputation flag | REJECT | ✅ |
| 5 | Borderline amount | REVIEW | ✅ |
| 6 | Amount above hard limit | REJECT | ✅ |
| 7 | Unknown recipient | REVIEW | ✅ |

---

## Open questions / blockers

- None

---

## Handoff notes for P2 (fill in at Step 8)

- Final function signature: `evaluateAction(agent: Agent, request: ActionRequestInput, riskContext: { isKnownRecipient: boolean; isAnomalousAmount?: boolean }, hasRecentFlag: boolean): EvaluateResult`
- Any assumptions P2 should know about: (1) hasRecentFlag and riskContext are NOT part of the Agent/ActionRequestInput types — P2's API layer must compute/pass these in separately before calling evaluateAction. (2) The function only returns { decision, reasons } — actionRequestId, authorizationToken, and docketMatches must be populated by the API layer after calling this function. (3) On REJECT, only the first failing rule's reason is returned, not an accumulated list — this is intentional (matches spec order).
- Known edge cases not covered: values are assumed to be valid types already (e.g. no NaN/negative amount handling) — worth confirming with P2 whether the API layer validates input shape before calling evaluateAction, or if the engine should defensively check too.


