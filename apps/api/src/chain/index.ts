import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  getAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

export type Hex = `0x${string}`;

// ─── ABIs ──────────────────────────────────────────────────────────────────────

/**
 * VerdictGate.executeTransfer(address to, uint256 amount)
 * Only callable by the contract owner (the backend wallet).
 */
const VERDICT_GATE_ABI = [
  {
    name: 'executeTransfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to',     type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

/** Minimal ERC-20 ABI — direct transfer fallback (no deployed gate contract). */
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to',    type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// ─── Clients ───────────────────────────────────────────────────────────────────

/**
 * Lazily-initialised viem clients — created once per call and reused.
 * Throws at call-time (not at import-time) so missing env vars produce a
 * clear runtime error rather than crashing the server on startup.
 */
function getClients() {
  const rpcUrl      = process.env.BASE_SEPOLIA_RPC_URL;
  const privateKey  = process.env.VERDICT_BACKEND_PRIVATE_KEY as Hex | undefined;

  if (!rpcUrl) {
    throw new Error('[chain] BASE_SEPOLIA_RPC_URL is not set');
  }
  if (!privateKey?.startsWith('0x')) {
    throw new Error('[chain] VERDICT_BACKEND_PRIVATE_KEY is not set or not a valid 0x-prefixed hex key');
  }

  const account = privateKeyToAccount(privateKey);

  return {
    walletClient: createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    }),
    publicClient: createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    }),
  };
}

// ─── Core function ─────────────────────────────────────────────────────────────

/**
 * Executes a token transfer on Base Sepolia, enforced at two layers:
 *
 * **Layer 1 — Off-chain (backend):** `/actions/execute` verifies the agent
 * identity, checks the authorization_token is valid/unexpired/unconsumed, and
 * confirms the decision is ALLOW before ever reaching this function.
 *
 * **Layer 2 — On-chain (VerdictGate contract):** When `VERDICT_GATE_ADDRESS` is
 * set, the transfer is routed through the deployed VerdictGate.sol contract.
 * The contract enforces `onlyOwner` — only the backend wallet can call it —
 * making it impossible for any external party to release funds without passing
 * the full verdict gate. A REJECT is a genuine on-chain block.
 *
 * If `VERDICT_GATE_ADDRESS` is not set (e.g. during local dev before deployment),
 * falls back to a direct ERC-20 transfer from the backend wallet.
 *
 * Locked signature for team integration (P2 ↔ P3 contract):
 * @param to     Recipient address (0x...)
 * @param amount Human-readable token amount (e.g. 5 for 5 USDC).
 *               Scaled internally by TEST_TOKEN_DECIMALS (default: 6).
 * @returns      Promise resolving to the confirmed transaction hash (0x...)
 */
export async function executeTransfer(to: Hex, amount: number): Promise<string> {
  const tokenAddress   = process.env.TEST_TOKEN_ADDRESS   as Hex | undefined;
  const gateAddress    = process.env.VERDICT_GATE_ADDRESS as Hex | undefined;
  const decimals       = parseInt(process.env.TEST_TOKEN_DECIMALS ?? '6', 10);

  if (!tokenAddress?.startsWith('0x')) {
    throw new Error('[chain] TEST_TOKEN_ADDRESS is not set or not a valid 0x address');
  }

  const { walletClient, publicClient } = getClients();

  // Scale from human-readable → raw on-chain units (e.g. 5 USDC → 5_000_000)
  const rawAmount = parseUnits(amount.toString(), decimals);

  let txHash: Hex;

  if (gateAddress?.startsWith('0x')) {
    // ── Path A: Route through VerdictGate (on-chain enforcement) ──────────────
    console.log(`[chain] Routing through VerdictGate at ${gateAddress}`);
    txHash = await walletClient.writeContract({
      address: getAddress(gateAddress),
      abi:     VERDICT_GATE_ABI,
      functionName: 'executeTransfer',
      args: [getAddress(to), rawAmount],
    });
  } else {
    // ── Path B: Direct ERC-20 transfer (fallback — no gate deployed yet) ──────
    console.log(`[chain] VERDICT_GATE_ADDRESS not set — falling back to direct ERC-20 transfer`);
    txHash = await walletClient.writeContract({
      address: getAddress(tokenAddress),
      abi:     ERC20_ABI,
      functionName: 'transfer',
      args: [getAddress(to), rawAmount],
    });
  }

  console.log(`[chain] Transfer submitted — txHash: ${txHash}`);

  // Wait for 1-block confirmation so the returned hash is genuinely on-chain
  const receipt = await publicClient.waitForTransactionReceipt({
    hash:          txHash,
    confirmations: 1,
  });

  if (receipt.status === 'reverted') {
    throw new Error(`[chain] Transaction reverted on-chain — txHash: ${txHash}`);
  }

  console.log(`[chain] Transfer confirmed — block: ${receipt.blockNumber}, txHash: ${txHash}`);
  return txHash;
}
