-- Migration 001: Token Schema Hardening
-- Ensures token_expires_at, token_consumed columns and unique token index exist on action_requests

-- Ensure unique index on authorization_token (partial index where token is non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_action_requests_token_unique 
ON action_requests(authorization_token) 
WHERE authorization_token IS NOT NULL;

-- Index for expiration and consumption status checks
CREATE INDEX IF NOT EXISTS idx_action_requests_token_status 
ON action_requests(id, authorization_token, token_consumed);
