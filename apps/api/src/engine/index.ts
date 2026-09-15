import { Decision, ActionRequestInput } from '@verdict/shared';

export interface EngineDecision {
  decision: Decision;
  reasons: string[];
}

/**
 * Isolated decision engine call site.
 * Currently uses deterministic stub branching to unblock P2 & P4 development.
 * When P1 delivers the real verdict-engine, swapping it in happens solely in this function!
 */
export function evaluateAction(input: ActionRequestInput): EngineDecision {
  const { agentId, actionType, amount, token } = input;

  // 1. Agent Alpha (verified, within limits, valid capability) -> ALLOW
  if (agentId === 'agent-alpha' || agentId.toLowerCase().includes('alpha')) {
    return {
      decision: 'ALLOW',
      reasons: [
        'Agent identity verified with trusted credentials',
        `Declared capability '${actionType}' confirmed`,
        `Amount (${amount} ${token}) is within policy limit`,
        'Recipient address cleared reputation screening',
      ],
    };
  }

  // 2. Agent Shadow (unverified, zero limit, no declared capability) -> REJECT
  if (agentId === 'agent-shadow' || agentId.toLowerCase().includes('shadow')) {
    return {
      decision: 'REJECT',
      reasons: [
        'Agent identity unverified / untrusted',
        `Agent has no declared capability for '${actionType}'`,
        'Zero-trust policy violation: request exceeds limit for unverified agents',
      ],
    };
  }

  // 3. Fallback / Borderline -> REVIEW
  return {
    decision: 'REVIEW',
    reasons: [
      `Request amount (${amount} ${token}) exceeds soft review threshold`,
      'Counterparty recipient address has low transaction frequency',
    ],
  };
}
