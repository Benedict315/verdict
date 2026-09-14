---
name: verdict-p2-backend
description: Use this skill for ANY work on the Verdict hackathon project's backend, API, or database layer — Node.js + TypeScript + Express + better-sqlite3 code living in apps/api/src/db/, apps/api/src/routes/, or apps/api/src/server.ts. Trigger this whenever the user (P2) mentions Verdict, the verdict-engine repo, /trust/evaluate, /actions/execute, authorization tokens, the docket, agent registration, SQLite schema work, or any of the 8 API endpoints in the Step 5 contract table — even if they don't explicitly say "backend" or "API." Also trigger for questions about token issue/verify/consume logic, stubbing P1's evaluateAction() or P3's executeTransfer(), or preparing for the P1↔P2 / P2↔P3 / P2↔P4 integration pairing sessions. This skill encodes the frozen API contract, schema, and security invariants from the team's README and build plan so generated code stays consistent with what P1, P3, and P4 are building against.
---

# Verdict — P2 Backend/API/Database

You are helping P2 build the backend for **Verdict**, a pre-action security gate for autonomous agents (Orion Agents Builder Hackathon). P2 owns `apps/api/src/db/`, `apps/api/src/routes/`, and `apps/api/src/server.ts`.

**The one property the whole demo depends on, that P2 is responsible for:** `/actions/execute` must be provably impossible to call successfully without a valid, unexpired, single-use `authorization_token` issued by `/trust/evaluate`. Every decision below should be made in service of that invariant.

## Non-negotiables (read before writing any code)

1. **P2 never makes the ALLOW/REVIEW/REJECT decision.** That's P1's pure `evaluateAction()` function. P2's routes call it, persist the result, and act on it — no decision logic, no LLM calls, in the routes themselves.
2. **The Step 5 contract is frozen after Day 1.** Don't change a request/response shape unilaterally — P4 and P3 are building against it. If a change seems necessary, say so explicitly and flag it as a breaking change rather than silently adjusting a field.
3. **Stub, don't block.** On Day 1, P1's engine and P3's `executeTransfer()` may not exist yet. Build against stubs (engine stub always returns ALLOW; chain stub returns a fake tx hash matching the real signature) so routes and schema work land immediately.
4. **`packages/shared/types.ts` and `apps/api/src/db/schema.sql` are not solo-edit files.** Flag any change to these before writing it.

## Database schema (5 tables)

When scaffolding `schema.sql`, include at minimum:
- `agents` — id, wallet_address, display_name, capabilities (JSON array or join table), verification_status, transaction_limit, review_threshold, created_at
- `action_requests` — id, agent_id (FK), action_type, target_address, amount, token, decision, reasons (JSON), authorization_token, token_expires_at, token_consumed (bool), tx_hash, status, created_at
- `docket_entries` — id, action_request_id (FK), category, summary, human_decision, created_at
- plus whatever supporting tables you need for capabilities/audit trail — keep it to 5 total per the README, don't over-normalize under hackathon time pressure.

Use `better-sqlite3` with typed query helper functions (one file per table is fine) — never inline raw SQL string concatenation in route handlers.

## API contract (frozen — Step 5)

| Endpoint | Request body | Response |
|---|---|---|
| `POST /agents` | `{ walletAddress, displayName, capabilities[], verificationStatus, transactionLimit, reviewThreshold }` | `Agent` object, 201 |
| `GET /agents/:id` | — | `Agent` object or 404 |
| `POST /trust/evaluate` | `{ agentId, actionType, targetAddress, amount, token }` | `{ actionRequestId, decision, reasons[], authorizationToken | null, docketMatches[] }` |
| `POST /actions/execute` | `{ actionRequestId, authorizationToken }` | `ActionRequest` with `txHash`, or 403 if token invalid |
| `GET /actions/:id` | — | `ActionRequest` or 404 |
| `GET /actions` | — | `ActionRequest[]`, newest first |
| `POST /actions/:id/review` | `{ approve: boolean }` | Updated `ActionRequest`; if approved, includes a fresh `authorizationToken` |
| `GET /docket/search?category=` | — | `DocketEntry[]`, up to 5 |

Validate every request body with `zod` at the route boundary — reject malformed input with 400 before it touches the DB or the engine.

## Authorization token logic (the security-critical part)

- Issue a token **only** when `evaluateAction()` returns `ALLOW` (or a human approves a `REVIEW` via `/actions/:id/review`).
- Token must be: **single-use** (mark consumed atomically on first successful `/actions/execute` call — use a DB transaction or `UPDATE ... WHERE token_consumed = 0` and check the affected-row count to avoid a race), **expiring** (short TTL, e.g. 5 minutes, checked server-side, not just client-side), and **tied to the specific `actionRequestId`** it was issued for (reject if the token doesn't match the request).
- `/actions/execute` must independently re-verify the token even though `/trust/evaluate` already decided ALLOW — never trust that a client only calls execute after a real ALLOW.
- A `REJECT` must **never** produce a token, full stop — there is no code path where a rejected action gets one, even conditionally.

### Definition of DONE for this piece
Write these as explicit tests before considering the route finished:
- Calling `/actions/execute` with no token → rejected.
- Calling `/actions/execute` with a token from a REJECT action → rejected (shouldn't even exist, but test defensively).
- Calling `/actions/execute` twice with the same valid token → second call rejected (reused-token test).
- Calling `/actions/execute` after the token TTL has passed → rejected.
- Calling `/actions/execute` with a token issued for a different `actionRequestId` → rejected.

This is the single most important test suite in the whole project — treat it as blocking, not a nice-to-have.

## Integration order (don't build ahead of this)

1. Shared types frozen (whole team, Day 1).
2. Schema + mock routes (P2 solo, Day 1) — routes return hardcoded fixture data matching the contract table above so P4 is never blocked.
3. Wire P1's real `evaluateAction()` into `/trust/evaluate` (P1↔P2 pairing session — schedule explicitly, don't hand off silently).
4. Wire P3's real `executeTransfer()` into `/actions/execute` (P2↔P3 pairing session).
5. Swap P4 off fixtures onto the real API (P2↔P4 pairing session).
6. `docket_entries` + `/docket/search` — only after 1–5 are demo-reliable. Don't start this early even if it sounds fun.

## When asked to write code

- Default stack: Node.js + TypeScript + Express + better-sqlite3 + zod. Don't introduce a different ORM, framework, or validation library without being asked.
- Keep route handlers thin: validate → call engine/chain function → persist → respond. Business logic that isn't pure request/response plumbing belongs in P1's or P3's packages, not inline in a route.
- When P1's or P3's real function isn't available yet, write the stub with the **exact agreed signature** (e.g. `executeTransfer(to: Hex, amount: number): Promise<string>`) so swapping in the real implementation later is a one-line import change, not a rewrite.
- Seed script (`scripts/seed-demo-agents.ts`) must be **idempotent** — safe to re-run right before the demo without creating duplicate agents or corrupting state.
- Never suggest scope-creep items from the cut list (decentralized reputation, multi-chain, semantic docket search, on-chain precedent registry, etc.) even if they'd make for an interesting-sounding addition — the team has explicitly ruled these out for the hackathon.

## Reference

For the full picture beyond P2's scope (P1's 5-rule engine logic, P3's chain setup, P4's UI, the demo script, timeline, and fallback plans), the user has the full README and build-plan doc in this conversation — refer back to those rather than assuming details not stated here.
