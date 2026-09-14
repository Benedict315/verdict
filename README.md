# Verdict

**Verify the agent. Evaluate the action. Render the verdict.**

Verdict is a pre-action security gate for autonomous agents. Before an agent performs a sensitive action, Verdict checks its identity, capabilities, policy limits, and risk signals — then returns **ALLOW**, **REVIEW**, or **REJECT**. A rejected action is genuinely blocked; it never produces an executable transaction.

Built for the **Orion Agents Builder Hackathon**.

---

## The Problem

AI agents are gaining the ability to act independently — sending funds, calling contracts, making decisions with no human in the loop. Autonomous action creates a trust problem: there's currently no standard way to verify that an agent is who it claims to be, is authorized for the action it's attempting, or is behaving within safe bounds *before* it acts.

## The Solution

Verdict sits in front of any sensitive agent action as a pre-action gate:

1. **Verifies identity** — is this a known, registered agent?
2. **Checks capabilities** — is this agent authorized for this type of action?
3. **Evaluates policy** — does the amount fall within the agent's configured limits?
4. **Checks risk/reputation** — any flags, unknown recipients, or anomalies?
5. **Returns a decision** — `ALLOW`, `REVIEW`, or `REJECT`.

An `ALLOW` proceeds to real execution on Base Sepolia. A `REJECT` is genuinely blocked — no transaction is ever produced. A `REVIEW` routes to a human, backed by **the Docket**: a lightweight record of similar past decisions that helps a reviewer decide faster.

**The decision is always deterministic.** An LLM is never the authority on ALLOW/REJECT/REVIEW — that logic is a pure, auditable function. The only place AI may optionally appear is generating a plain-language summary for the Docket, after a human has already decided.

---

## Demo

| Scenario | Agent | Request | Result |
|---|---|---|---|
| A | Agent Alpha (verified, clean history) | Send 5 USDC to a known recipient | 🟢 **ALLOW** — real transaction executes on Base Sepolia |
| B | Agent Shadow (unverified, no declared capability) | Send 500 USDC | 🔴 **REJECT** — transaction blocked, reason shown on screen |
| C (optional) | A borderline request just above the soft limit | — | 🟡 **REVIEW** — the Docket surfaces similar past cases to help a human decide |

Success criteria: a judge should understand the product in under 30 seconds and see, live, that an approved action executes while a rejected one is actually blocked.

---

## Architecture

```
Agent
  │
  ▼
POST /trust/evaluate ──► Verdict Engine (pure, deterministic)
  │                           │
  │                     ALLOW / REVIEW / REJECT
  │                           │
  ├── ALLOW ──► authorization_token issued ──► POST /actions/execute ──► Base Sepolia transfer
  ├── REVIEW ─► Docket queried for similar past cases ──► human reviews ──► POST /actions/:id/review
  └── REJECT ─► nothing issued, nothing executable
```

Execution is only ever reachable through a valid, single-use `authorization_token` produced by `/trust/evaluate`. There is no other path to on-chain execution — this is what makes a REJECT a real block, not a cosmetic warning.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind |
| Backend | Node.js + TypeScript + Express |
| Database | SQLite (better-sqlite3) |
| Blockchain | Base Sepolia (testnet) |
| Web3 library | viem |
| AI (optional) | Any hosted LLM API — explanations only, never the decision |

## Project Structure

```
verdict/
├── apps/
│   ├── web/                    # frontend dashboard (Next.js)
│   └── api/                    # backend
│       └── src/
│           ├── db/             # schema.sql + typed query helpers
│           ├── engine/         # (re-exports packages/verdict-engine)
│           ├── routes/         # agents, actions, docket
│           └── chain/          # Base Sepolia execution (viem)
├── packages/
│   ├── verdict-engine/         # pure, deterministic decision logic
│   ├── contracts/              # optional Solidity (VerdictGate.sol) — see below
│   └── shared/                 # shared TypeScript types
├── scripts/
│   └── seed-demo-agents.ts     # creates Agent Alpha + Agent Shadow
├── docs/
│   └── architecture.md
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A Base Sepolia wallet (fresh keypair — do not reuse a personal wallet)
- Base Sepolia test ETH ([Base faucet](https://www.base.org/) or Coinbase Developer Platform faucet)
- A Base Sepolia RPC URL (public endpoint, or a free-tier provider like Alchemy/Infura)
- A test USDC / ERC-20 faucet token address on Base Sepolia

### Install

```bash
git clone <this-repo>
cd verdict
npm install
```

### Configure

Create `apps/api/.env` (never commit this file):

```bash
PORT=4000
VERDICT_DB_PATH=./verdict.db
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
VERDICT_BACKEND_PRIVATE_KEY=0x...        # backend wallet, testnet only
TEST_TOKEN_ADDRESS=0x...                 # Base Sepolia test USDC / ERC-20
TEST_TOKEN_DECIMALS=6
```

### Run the backend

```bash
cd apps/api
npm run dev
```

The schema is applied automatically on startup (`initSchema()`).

### Seed demo agents

```bash
npm run seed
```

Creates **Agent Alpha** (verified, capable, clean history) and **Agent Shadow** (unverified, no declared capabilities) — idempotent, safe to re-run before the demo.

### Run the frontend

```bash
cd apps/web
npm run dev
```

---

## API Reference

| Endpoint | Purpose |
|---|---|
| `POST /agents` | Register an agent (wallet, capabilities, limit, verification status) |
| `GET /agents/:id` | Fetch agent passport |
| `POST /trust/evaluate` | Evaluate an intended action → decision + `authorization_token` if ALLOW |
| `POST /actions/execute` | Execute only with a valid, unexpired `authorization_token` |
| `GET /actions` | List all past requests |
| `GET /actions/:id` | View a single decision + audit trail |
| `POST /actions/:id/review` | Human approves/denies a REVIEW-state request; writes a Docket entry |
| `GET /docket/search?category=` | Return up to 5 similar past Docket entries |

REST, synchronous, no websockets or queues by design — fewer moving parts to fail live on stage.

---

## Security Model

- **Deterministic core.** `evaluateAction()` in `packages/verdict-engine` is a pure function — no network calls, no database access, no LLM. Same input, same output, every time.
- **No bypass.** `/actions/execute` cannot run without a valid, single-use `authorization_token` issued by `/trust/evaluate`. There is no other path to execution.
- **AI never decides.** The Docket may use AI to generate a plain-language summary of a case, but the verdict on any REVIEW request is always a human's decision, recorded as-is.
- **Testnet only.** All funds and transactions in this hackathon build are Base Sepolia testnet — no real funds are ever at risk.

See `docs/architecture.md` for the full risk/mitigation table.

---

## What This Is Not (Scope)

Deliberately **not** built for this hackathon: a decentralized reputation network, multi-chain support, an agent marketplace, DAO governance, LLM judge-panel voting, IPFS storage, semantic/embedding-based Docket search, an on-chain precedent registry, or multi-agent appeal workflows. Every one of these is a plausible future direction, not a requirement to prove the core idea: **a pre-action gate that can genuinely say no.**

---

## Team

Built by a team of 4 for the Orion Agents Builder Hackathon:
- **Verdict Engine / Security Logic**
- **Backend / API / Database**
- **Blockchain / Enforcement**
- **Frontend / UX / Demo**

## License

MIT (or update to match your hackathon submission requirements).
