-- ============================================================================
-- Verdict Database Schema (SQLite)
-- 5 Tables: agents, agent_capabilities, action_requests, docket_entries, audit_trail_entries
-- ============================================================================

-- 1. Agents Passport Table
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'unverified', 'flagged')) DEFAULT 'unverified',
    transaction_limit REAL NOT NULL DEFAULT 0.0,
    review_threshold REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agents_wallet ON agents(wallet_address);

-- 2. Agent Capabilities Supporting Table
CREATE TABLE IF NOT EXISTS agent_capabilities (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    capability TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(agent_id, capability)
);

CREATE INDEX IF NOT EXISTS idx_agent_capabilities_agent ON agent_capabilities(agent_id);

-- 3. Action Requests (Pre-action evaluation, tokens, decisions, execution hash)
CREATE TABLE IF NOT EXISTS action_requests (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    action_type TEXT NOT NULL,
    target_address TEXT NOT NULL,
    amount REAL NOT NULL,
    token TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('ALLOW', 'REVIEW', 'REJECT')),
    reasons TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
    authorization_token TEXT UNIQUE,
    token_expires_at TEXT,
    token_consumed INTEGER NOT NULL DEFAULT 0 CHECK (token_consumed IN (0, 1)),
    tx_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTING', 'EXECUTED', 'FAILED')) DEFAULT 'PENDING',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_action_requests_agent ON action_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_action_requests_token ON action_requests(authorization_token);
CREATE INDEX IF NOT EXISTS idx_action_requests_created ON action_requests(created_at DESC);

-- 4. Docket Entries (Precedents & human decisions)
CREATE TABLE IF NOT EXISTS docket_entries (
    id TEXT PRIMARY KEY,
    action_request_id TEXT NOT NULL REFERENCES action_requests(id),
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    human_decision TEXT NOT NULL CHECK (human_decision IN ('APPROVED', 'DENIED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_docket_entries_category ON docket_entries(category);
CREATE INDEX IF NOT EXISTS idx_docket_entries_request ON docket_entries(action_request_id);

-- 5. Audit Trail Entries (Immutable event stream)
CREATE TABLE IF NOT EXISTS audit_trail_entries (
    id TEXT PRIMARY KEY,
    action_request_id TEXT NOT NULL REFERENCES action_requests(id),
    event_type TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '{}', -- JSON metadata
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_request ON audit_trail_entries(action_request_id);
