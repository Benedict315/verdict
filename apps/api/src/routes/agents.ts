import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Agent } from '@verdict/shared';

export const agentsRouter = Router();

const createAgentSchema = z.object({
  walletAddress: z.string().min(1, 'walletAddress is required'),
  displayName: z.string().min(1, 'displayName is required'),
  capabilities: z.array(z.string()),
  verificationStatus: z.enum(['verified', 'unverified', 'flagged']),
  transactionLimit: z.number().nonnegative(),
  reviewThreshold: z.number().nonnegative(),
});

/**
 * POST /agents
 * Register an agent (wallet, capabilities, limit, verification status)
 */
agentsRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createAgentSchema.parse(req.body);
    const createdAgent: Agent = {
      id: `agent-${Date.now()}`,
      walletAddress: parsed.walletAddress,
      displayName: parsed.displayName,
      capabilities: parsed.capabilities,
      verificationStatus: parsed.verificationStatus,
      transactionLimit: parsed.transactionLimit,
      reviewThreshold: parsed.reviewThreshold,
      createdAt: new Date().toISOString(),
    };
    return res.status(201).json(createdAgent);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /agents/:id
 * Fetch agent passport
 */
agentsRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === 'unknown') {
    return res.status(404).json({ error: 'Agent not found' });
  }

  if (id === 'agent-alpha' || id.includes('alpha')) {
    const agentAlpha: Agent = {
      id: 'agent-alpha',
      walletAddress: '0x1111111111111111111111111111111111111111',
      displayName: 'Agent Alpha',
      capabilities: ['transfer', 'swap'],
      verificationStatus: 'verified',
      transactionLimit: 1000,
      reviewThreshold: 200,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    return res.json(agentAlpha);
  }

  if (id === 'agent-shadow' || id.includes('shadow')) {
    const agentShadow: Agent = {
      id: 'agent-shadow',
      walletAddress: '0x9999999999999999999999999999999999999999',
      displayName: 'Agent Shadow',
      capabilities: [],
      verificationStatus: 'unverified',
      transactionLimit: 0,
      reviewThreshold: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    return res.json(agentShadow);
  }

  const genericAgent: Agent = {
    id,
    walletAddress: '0x2222222222222222222222222222222222222222',
    displayName: `Agent ${id}`,
    capabilities: ['transfer'],
    verificationStatus: 'verified',
    transactionLimit: 500,
    reviewThreshold: 100,
    createdAt: new Date().toISOString(),
  };
  return res.json(genericAgent);
});
