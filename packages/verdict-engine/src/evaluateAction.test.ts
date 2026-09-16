import { describe, it, expect } from 'vitest';
import { Agent, ActionRequestInput, EvaluateResult } from '@verdict/shared';
import { evaluateAction, categorizeForDocket } from './evaluateAction';

describe('evaluateAction', () => {
  const baseAgent: Agent = {
    id: 'agent-1',
    walletAddress: '0x1111111111111111111111111111111111111111',
    displayName: 'Test Agent',
    capabilities: ['TRANSFER'],
    verificationStatus: 'verified',
    transactionLimit: 1000,
    reviewThreshold: 5000,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const baseRequest: ActionRequestInput = {
    agentId: 'agent-1',
    actionType: 'TRANSFER',
    targetAddress: '0x2222222222222222222222222222222222222222',
    amount: 100,
    token: 'USDC',
  };

  // 1. Verified agent, valid amount, known recipient, no flag → ALLOW
  it('allows a verified agent with a valid amount, known recipient, and no flag', () => {
    const result: EvaluateResult = evaluateAction(
      baseAgent,
      baseRequest,
      { isKnownRecipient: true },
      false
    );
    expect(result.decision).toBe('ALLOW');
    expect(result.reasons).toEqual(['all_checks_passed']);
    expect(result.actionRequestId).toBeUndefined();
    expect(result.authorizationToken).toBeUndefined();
    expect(result.docketMatches).toBeUndefined();
  });

  // 2. verificationStatus 'unverified' → REJECT
  it('rejects when verificationStatus is unverified', () => {
    const agent: Agent = {
      ...baseAgent,
      verificationStatus: 'unverified',
    };
    const result: EvaluateResult = evaluateAction(
      agent,
      baseRequest,
      { isKnownRecipient: true },
      false
    );
    expect(result.decision).toBe('REJECT');
    expect(result.reasons).toEqual(['identity_unverified: agent not verified']);
  });

  // 3. capabilities missing the requested actionType → REJECT
  it('rejects when capabilities are missing the requested actionType', () => {
    const agent: Agent = {
      ...baseAgent,
      capabilities: ['SWAP'],
    };
    const request: ActionRequestInput = {
      ...baseRequest,
      actionType: 'TRANSFER',
    };
    const result: EvaluateResult = evaluateAction(
      agent,
      request,
      { isKnownRecipient: true },
      false
    );
    expect(result.decision).toBe('REJECT');
    expect(result.reasons).toEqual(["capability_missing: agent not authorized for 'TRANSFER'"]);
  });

  // 4. hasRecentFlag true → REJECT
  it('rejects when hasRecentFlag is true', () => {
    const result: EvaluateResult = evaluateAction(
      baseAgent,
      baseRequest,
      { isKnownRecipient: true },
      true
    );
    expect(result.decision).toBe('REJECT');
    expect(result.reasons).toEqual(['reputation_flagged: agent has recent flagged history']);
  });

  // 5. amount above transactionLimit but within reviewThreshold → REVIEW
  it('reviews when amount is above transactionLimit but within reviewThreshold', () => {
    const request: ActionRequestInput = {
      ...baseRequest,
      amount: 2500,
    };
    const result: EvaluateResult = evaluateAction(
      baseAgent,
      request,
      { isKnownRecipient: true },
      false
    );
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['policy_review: exceeds limit, within review threshold']);
  });

  // 6. amount above both transactionLimit and reviewThreshold → REJECT
  it('rejects when amount is above both transactionLimit and reviewThreshold', () => {
    const request: ActionRequestInput = {
      ...baseRequest,
      amount: 6000,
    };
    const result: EvaluateResult = evaluateAction(
      baseAgent,
      request,
      { isKnownRecipient: true },
      false
    );
    expect(result.decision).toBe('REJECT');
    expect(result.reasons).toEqual(['policy_fail: amount 6000 exceeds limit 1000']);
  });

  // 7. riskContext.isKnownRecipient false → REVIEW
  it('reviews when riskContext.isKnownRecipient is false', () => {
    const result: EvaluateResult = evaluateAction(
      baseAgent,
      baseRequest,
      { isKnownRecipient: false },
      false
    );
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons).toEqual(['risk_flag: new recipient or anomalous amount']);
  });
});

describe('categorizeForDocket', () => {
  it('returns new_recipient when reasons include risk_flag reason', () => {
    expect(categorizeForDocket(['risk_flag: new recipient or anomalous amount'])).toBe('new_recipient');
  });

  it('returns near_limit when reasons include policy_review reason', () => {
    expect(categorizeForDocket(['policy_review: exceeds limit, within review threshold'])).toBe('near_limit');
  });

  it('returns uncategorized for other reasons', () => {
    expect(categorizeForDocket(['all_checks_passed'])).toBe('uncategorized');
    expect(categorizeForDocket(['identity_unverified: agent not verified'])).toBe('uncategorized');
  });
});
