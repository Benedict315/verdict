import { Router, Request, Response } from 'express';
import { DocketEntry } from '@verdict/shared';

export const docketRouter = Router();

const sampleDocketEntries: DocketEntry[] = [
  {
    id: 'doc-001',
    actionRequestId: 'act-001-transfer',
    category: 'transfer',
    summary: 'Transfer of 150 USDC to cold vault approved by risk officer.',
    humanDecision: 'APPROVED',
    createdAt: '2026-03-01T10:15:00.000Z',
  },
  {
    id: 'doc-002',
    actionRequestId: 'act-002-transfer',
    category: 'transfer',
    summary: 'Transfer of 500 USDC to unverified mixer address denied.',
    humanDecision: 'DENIED',
    createdAt: '2026-02-28T16:40:00.000Z',
  },
  {
    id: 'doc-003',
    actionRequestId: 'act-003-swap',
    category: 'swap',
    summary: 'Large Uniswap slippage tolerance override approved after checking liquidity.',
    humanDecision: 'APPROVED',
    createdAt: '2026-02-25T11:05:00.000Z',
  },
  {
    id: 'doc-004',
    actionRequestId: 'act-004-transfer',
    category: 'transfer',
    summary: 'Micro-transfer of 2 USDC to faucet approved automatically by admin.',
    humanDecision: 'APPROVED',
    createdAt: '2026-02-20T08:30:00.000Z',
  },
  {
    id: 'doc-005',
    actionRequestId: 'act-005-contract_call',
    category: 'contract_call',
    summary: 'Unverified proxy contract call denied due to unverified byte code.',
    humanDecision: 'DENIED',
    createdAt: '2026-02-15T19:22:00.000Z',
  },
];

/**
 * GET /docket/search?category=
 * Return up to 5 similar past Docket entries
 */
docketRouter.get('/search', (req: Request, res: Response) => {
  const category = (req.query.category as string | undefined)?.toLowerCase();

  let results = sampleDocketEntries;
  if (category) {
    results = sampleDocketEntries.filter((entry) => entry.category.toLowerCase().includes(category));
  }

  return res.json(results.slice(0, 5));
});
