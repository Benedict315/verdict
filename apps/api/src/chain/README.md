# Chain Execution Layer (`apps/api/src/chain`)

Owned by **P3 (Blockchain / Enforcement)**.

This directory handles on-chain transaction submission and verification on Base Sepolia using `viem`.

## Interface Contract

```typescript
export type Hex = `0x${string}`;
export function executeTransfer(to: Hex, amount: number): Promise<string>;
```

P2 routes call `executeTransfer` only after verifying a valid, unexpired, single-use `authorization_token`.
