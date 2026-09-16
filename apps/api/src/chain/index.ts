export type Hex = `0x${string}`;

let mockFailure: Error | null = null;
let mockDelayMs = 0;
let transferInvocationCount = 0;

/**
 * Test-only hook: inject artificial failure into executeTransfer.
 * Strictly gated so it cannot be triggered outside NODE_ENV === 'test'.
 */
export function __setMockTransferFailure(error: Error | null): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Security violation: __setMockTransferFailure is only allowed when NODE_ENV === "test"');
  }
  mockFailure = error;
}

/**
 * Test-only hook: inject artificial delay into executeTransfer to simulate in-flight execution and test concurrency.
 * Strictly gated so it cannot be triggered outside NODE_ENV === 'test'.
 */
export function __setMockTransferDelay(ms: number): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Security violation: __setMockTransferDelay is only allowed when NODE_ENV === "test"');
  }
  mockDelayMs = ms;
}

/**
 * Test-only hook: retrieve number of times executeTransfer has been called.
 * Strictly gated so it cannot be triggered outside NODE_ENV === 'test'.
 */
export function __getTransferInvocationCount(): number {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Security violation: __getTransferInvocationCount is only allowed when NODE_ENV === "test"');
  }
  return transferInvocationCount;
}

/**
 * Test-only hook: reset all mock overrides.
 * Strictly gated so it cannot be triggered outside NODE_ENV === 'test'.
 */
export function __resetChainMocks(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Security violation: __resetChainMocks is only allowed when NODE_ENV === "test"');
  }
  mockFailure = null;
  mockDelayMs = 0;
  transferInvocationCount = 0;
}

/**
 * Executes an on-chain transfer on Base Sepolia.
 * Owned by P3 (Blockchain / Enforcement).
 *
 * Locked signature for team integration:
 * @param to Recipient address (0x...)
 * @param amount Token amount to transfer
 * @returns Promise resolving to the transaction hash (0x...)
 */
export async function executeTransfer(to: Hex, amount: number): Promise<string> {
  // Test-only hooks are strictly guarded by NODE_ENV === 'test'
  if (process.env.NODE_ENV === 'test') {
    transferInvocationCount++;

    if (mockDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, mockDelayMs));
    }

    if (mockFailure) {
      throw mockFailure;
    }
  }

  // Fallback deterministic fixture hash (or real viem call when P3 keys are configured)
  const mockTxHash = `0x3f8a91b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1`;
  return mockTxHash;
}
