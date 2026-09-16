import hre from 'hardhat';
import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import path from 'path';

// Load the API .env — try the path relative to this file first, then CWD fallback
const envPath = path.resolve(__dirname, '../../../apps/api/.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  // Fallback: try relative to CWD (when running `npx hardhat run` from packages/contracts)
  dotenv.config({ path: path.resolve(process.cwd(), '../../apps/api/.env') });
}

async function main() {
  const tokenAddress  = process.env.TEST_TOKEN_ADDRESS;
  const privateKey    = process.env.VERDICT_BACKEND_PRIVATE_KEY;
  const rpcUrl        = process.env.BASE_SEPOLIA_RPC_URL;

  if (!tokenAddress) throw new Error('TEST_TOKEN_ADDRESS is not set in apps/api/.env');
  if (!privateKey)   throw new Error('VERDICT_BACKEND_PRIVATE_KEY is not set in apps/api/.env');
  if (!rpcUrl)       throw new Error('BASE_SEPOLIA_RPC_URL is not set in apps/api/.env');

  // Build the signer explicitly from env — avoids relying on Hardhat's accounts config
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log(`\nDeploying VerdictGate`);
  console.log(`  Wallet:  ${deployer.address}`);
  console.log(`  Token:   ${tokenAddress}`);
  console.log(`  Network: ${hre.network.name}\n`);

  const VerdictGate = await ethers.getContractFactory('VerdictGate', deployer);
  const gate = await VerdictGate.deploy(tokenAddress, deployer.address);
  await gate.waitForDeployment();

  const address = await gate.getAddress();
  console.log(`✅ VerdictGate deployed to: ${address}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Add to apps/api/.env:  VERDICT_GATE_ADDRESS=${address}`);
  console.log(`  2. Fund the contract:     send test tokens to ${address}`);
  console.log(`  3. Restart the API server\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
