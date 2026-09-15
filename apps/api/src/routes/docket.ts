import { Router, Request, Response } from 'express';
import { DocketEntry } from '@verdict/shared';
import { getDb } from '../db';

export const docketRouter = Router();

const fallbackDocketEntries: DocketEntry[] = [
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
 * Return up to 5 similar past Docket entries from SQLite (with fallback)
 */
docketRouter.get('/search', (req: Request, res: Response) => {
  const category = (req.query.category as string | undefined)?.toLowerCase();
  const db = getDb();

  let query = 'SELECT * FROM docket_entries';
  const params: unknown[] = [];

  if (category) {
    query += ' WHERE LOWER(category) LIKE ?';
    params.push(`%${category}%`);
  }
  query += ' ORDER BY created_at DESC LIMIT 5';

  const rows = db.prepare(query).all(...params) as Array<{
    id: string;
    action_request_id: string;
    category: string;
    summary: string;
    human_decision: 'APPROVED' | 'DENIED';
    created_at: string;
  }>;

  if (rows.length > 0) {
    const results: DocketEntry[] = rows.map((r) => ({
      id: r.id,
      actionRequestId: r.action_request_id,
      category: r.category,
      summary: r.summary,
      humanDecision: r.human_decision,
      createdAt: r.created_at,
    }));
    return res.json(results);
  }

  // Fallback fixtures if database has no entries for category yet
  let fallback = fallbackDocketEntries;
  if (category) {
    fallback = fallbackDocketEntries.filter((entry) =>
      entry.category.toLowerCase().includes(category)
    );
  }
  return res.json(fallback.slice(0, 5));
});
