export type VerificationStatus = 'verified' | 'unverified' | 'flagged';

export interface Agent {
  id: string;
  walletAddress: string;
  displayName: string;
  capabilities: string[];
  verificationStatus: VerificationStatus;
  transactionLimit: number;
  reviewThreshold: number;
  createdAt: string;
}

export interface ActionRequestInput {
  agentId: string;
  actionType: string;
  targetAddress: string;
  amount: number;
  token: string;
}

export type Decision = 'ALLOW' | 'REVIEW' | 'REJECT';

export type ActionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';

export interface ActionRequest {
  id: string;
  agentId: string;
  actionType: string;
  targetAddress: string;
  amount: number;
  token: string;
  decision: Decision;
  reasons: string[];
  authorizationToken: string | null;
  tokenExpiresAt: string | null;
  tokenConsumed: boolean;
  txHash: string | null;
  status: ActionRequestStatus;
  createdAt: string;
}

export interface DocketEntry {
  id: string;
  actionRequestId: string;
  category: string;
  summary: string;
  humanDecision: 'APPROVED' | 'DENIED';
  createdAt: string;
}

export interface EvaluateResult {
  actionRequestId: string;
  decision: Decision;
  reasons: string[];
  authorizationToken: string | null;
  docketMatches: DocketEntry[];
}

export interface AuditTrailEntry {
  id: string;
  actionRequestId: string;
  eventType: string;
  details: Record<string, unknown> | string;
  timestamp: string;
}
