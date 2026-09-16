# Verdict Engine — Progress & Decision Log (P1)

Owner: P1 (Verdict Engine / Security Logic)
Branch: `feature/p1-verdict-engine`
Last updated: _(update this line each session)_

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
| 8 | Handoff to P2 | 🟡 In progress |

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

- Final function signature:
  ```ts
  function evaluateAction(
    agent: Agent,
    request: ActionRequestInput,
    riskContext: { isKnownRecipient: boolean; isAnomalousAmount?: boolean },
    hasRecentFlag: boolean
  ): EvaluateResult
  ```
- Any assumptions P2 should know about:
  `actionRequestId`, `authorizationToken`, and `docketMatches` are omitted / left undefined by the pure engine and should be populated downstream by the API layer.
- Docket categorization helper:
  `categorizeForDocket(reasons: string[]): string` returns `"new_recipient"`, `"near_limit"`, or `"uncategorized"`.

