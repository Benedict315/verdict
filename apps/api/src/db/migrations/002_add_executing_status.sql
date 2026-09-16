-- Migration 002: Add EXECUTING status to action_requests CHECK constraint
PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS action_requests_new (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    action_type TEXT NOT NULL,
    target_address TEXT NOT NULL,
    amount REAL NOT NULL,
    token TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('ALLOW', 'REVIEW', 'REJECT')),
    reasons TEXT NOT NULL DEFAULT '[]',
    authorization_token TEXT UNIQUE,
    token_expires_at TEXT,
    token_consumed INTEGER NOT NULL DEFAULT 0 CHECK (token_consumed IN (0, 1)),
    tx_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTING', 'EXECUTED', 'FAILED')) DEFAULT 'PENDING',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO action_requests_new SELECT * FROM action_requests;
DROP TABLE IF EXISTS action_requests;
ALTER TABLE action_requests_new RENAME TO action_requests;

CREATE INDEX IF NOT EXISTS idx_action_requests_agent ON action_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_action_requests_token ON action_requests(authorization_token);
CREATE INDEX IF NOT EXISTS idx_action_requests_created ON action_requests(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_action_requests_token_unique ON action_requests(authorization_token) WHERE authorization_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_requests_token_status ON action_requests(id, authorization_token, token_consumed);

PRAGMA foreign_keys=ON;
