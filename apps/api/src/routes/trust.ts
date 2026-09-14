import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EvaluateResult, DocketEntry } from '@verdict/shared';

export const trustRouter = Router();

const evaluateSchema = z.object({
  agentId: z.string().min(1, 'agentId is required'),
  actionType: z.string().min(1, 'actionType is required'),
  targetAddress: z.string().min(1, 'targetAddress is required'),
  amount: z.number().positive('amount must be positive'),
  token: z.string().min(1, 'token is required'),
});

/**
 * POST /trust/evaluate
 * Evaluates an intended action -> decision + authorization_token if ALLOW
 * Features agent-aware fixture branching for demo readiness:
 * - agent-alpha: ALLOW + valid authorization token
 * - agent-shadow: REJECT + null token + rejection reasons
 * - other: REVIEW + null token + docket precedents
 */
trustRouter.post('/evaluate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = evaluateSchema.parse(req.body);
    const actionRequestId = `act-${Date.now()}`;

    // 1. Agent Alpha -> ALLOW
    if (input.agentId === 'agent-alpha' || input.agentId.toLowerCase().includes('alpha')) {
      const result: EvaluateResult = {
        actionRequestId,
        decision: 'ALLOW',
        reasons: [
          'Agent identity verified with trusted credentials',
          `Declared capability '${input.actionType}' confirmed`,
          `Amount (${input.amount} ${input.token}) is within policy limit`,
          'Recipient address cleared reputation screening',
        ],
        authorizationToken: 'auth-tok-alpha-demo',
        docketMatches: [],
      };
      return res.json(result);
    }

    // 2. Agent Shadow -> REJECT
    if (input.agentId === 'agent-shadow' || input.agentId.toLowerCase().includes('shadow')) {
      const result: EvaluateResult = {
        actionRequestId,
        decision: 'REJECT',
        reasons: [
          'Agent identity unverified / untrusted',
          `Agent has no declared capability for '${input.actionType}'`,
          'Zero-trust policy violation: request exceeds limit for unverified agents',
        ],
        authorizationToken: null,
        docketMatches: [],
      };
      return res.json(result);
    }

    // 3. Fallback / Borderline -> REVIEW
    const sampleDocketMatches: DocketEntry[] = [
      {
        id: 'doc-precedent-001',
        actionRequestId: 'act-hist-882',
        category: input.actionType,
        summary: `Transfer of ${input.amount} ${input.token} approved after manual review of recipient origin`,
        humanDecision: 'APPROVED',
        createdAt: '2026-03-01T14:30:00.000Z',
      },
      {
        id: 'doc-precedent-002',
        actionRequestId: 'act-hist-741',
        category: input.actionType,
        summary: `Transfer to unindexed counterparty denied due to anomalous burst volume`,
        humanDecision: 'DENIED',
        createdAt: '2026-02-18T09:12:00.000Z',
      },
    ];

    const result: EvaluateResult = {
      actionRequestId,
      decision: 'REVIEW',
      reasons: [
        `Request amount (${input.amount} ${input.token}) exceeds soft review threshold`,
        'Counterparty recipient address has low transaction frequency',
      ],
      authorizationToken: null,
      docketMatches: sampleDocketMatches,
    };
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});
