# Decision Engine Swap-in Checklist (`apps/api/src/engine`)

This directory houses the single isolated call site for Verdict's deterministic decision engine.
During Phase 1–3 development, this runs on an isolated stub in `index.ts`.

When **P1 (Verdict Engine / Security Logic)** delivers the real engine from `packages/verdict-engine`, follow this 3-step checklist to swap it in instantly:

---

## 3-Step Swap Checklist

### 1. Verify Package & Export Signature
Confirm that `packages/verdict-engine` exports `evaluateAction()` matching the agreed pure signature:
```typescript
import { evaluateAction } from 'verdict-engine';
// Signature:
// evaluateAction(agent, request, riskContext, hasRecentFlag) => { decision: 'ALLOW' | 'REVIEW' | 'REJECT', reasons: string[] }
```

### 2. Update Single Call Site in `apps/api/src/engine/index.ts`
Replace the internal stub logic in `apps/api/src/engine/index.ts` with the real package invocation:
```typescript
import { evaluateAction as realEvaluateAction } from 'verdict-engine';
import { ActionRequestInput } from '@verdict/shared';

export function evaluateAction(input: ActionRequestInput) {
  // Pass agent passport and request parameters to real pure engine function
  return realEvaluateAction(input);
}
```
*(No route files need to be edited — `apps/api/src/routes/trust.ts` imports from this file only).*

### 3. Validate the 3 Core Demo Cases
Run `npm run test:api` and `npm run test:security` to confirm:
- **Scenario A (Agent Alpha)**: Send 5 USDC -> 🟢 **ALLOW** with valid authorization token.
- **Scenario B (Agent Shadow)**: Send 500 USDC -> 🔴 **REJECT** with null token and rejection reasons.
- **Scenario C (Borderline / Untrusted Counterparty)**: -> 🟡 **REVIEW** routing to Docket.
