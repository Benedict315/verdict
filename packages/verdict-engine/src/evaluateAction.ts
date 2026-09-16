import { Agent, ActionRequestInput, Decision, EvaluateResult } from '@verdict/shared';

export function evaluateAction(
  agent: Agent,
  request: ActionRequestInput,
  riskContext: { isKnownRecipient: boolean; isAnomalousAmount?: boolean },
  hasRecentFlag: boolean
): EvaluateResult {
  // 1. If agent.verificationStatus !== 'verified' → REJECT
  if (agent.verificationStatus !== 'verified') {
    return {
      decision: 'REJECT',
      reasons: ['identity_unverified: agent not verified'],
    } as unknown as EvaluateResult;
  }

  // 2. If !agent.capabilities.includes(request.actionType) → REJECT
  if (!agent.capabilities.includes(request.actionType)) {
    return {
      decision: 'REJECT',
      reasons: [`capability_missing: agent not authorized for '${request.actionType}'`],
    } as unknown as EvaluateResult;
  }

  // 3. If hasRecentFlag is true → REJECT
  if (hasRecentFlag) {
    return {
      decision: 'REJECT',
      reasons: ['reputation_flagged: agent has recent flagged history'],
    } as unknown as EvaluateResult;
  }

  // 4. If request.amount > agent.transactionLimit
  if (request.amount > agent.transactionLimit) {
    if (request.amount <= agent.reviewThreshold) {
      return {
        decision: 'REVIEW',
        reasons: ['policy_review: exceeds limit, within review threshold'],
      } as unknown as EvaluateResult;
    } else {
      return {
        decision: 'REJECT',
        reasons: [`policy_fail: amount ${request.amount} exceeds limit ${agent.transactionLimit}`],
      } as unknown as EvaluateResult;
    }
  }

  // 5. If riskContext.isKnownRecipient is false OR riskContext.isAnomalousAmount is true → REVIEW
  if (!riskContext.isKnownRecipient || Boolean(riskContext.isAnomalousAmount)) {
    return {
      decision: 'REVIEW',
      reasons: ['risk_flag: new recipient or anomalous amount'],
    } as unknown as EvaluateResult;
  }

  // 6. Otherwise → ALLOW
  return {
    decision: 'ALLOW',
    reasons: ['all_checks_passed'],
  } as unknown as EvaluateResult;
}

export function categorizeForDocket(reasons: string[]): string {
  if (reasons.some((r) => r === 'risk_flag: new recipient or anomalous amount' || r.includes('risk_flag'))) {
    return 'new_recipient';
  }
  if (reasons.some((r) => r === 'policy_review: exceeds limit, within review threshold' || r.includes('policy_review'))) {
    return 'near_limit';
  }
  return 'uncategorized';
}
