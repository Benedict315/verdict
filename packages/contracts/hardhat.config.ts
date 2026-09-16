import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';
import path from 'path';

// Load the API .env — try file-relative path first, then CWD fallback
const envPath = path.resolve(__dirname, '../../apps/api/.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
  dotenv.config({ path: path.resolve(process.cwd(), '../../apps/api/.env') });
}

const PRIVATE_KEY = process.env.VERDICT_BACKEND_PRIVATE_KEY ?? '';
const RPC_URL     = process.env.BASE_SEPOLIA_RPC_URL ?? 'https://sepolia.base.org';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    baseSepolia: {
      url:      RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId:  84532,
    },
  },
  // Sourcify verification — no API key required, works out of the box
  sourcify: {
    enabled: true,
  },
  // Etherscan/Basescan — requires a free API key from https://basescan.org
  // Set BASESCAN_API_KEY in apps/api/.env to enable
  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY ?? '',
    customChains: [
      {
        network:    'baseSepolia',
        chainId:    84532,
        urls: {
          apiURL:     'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org',
        },
      },
    ],
  },
  paths: {
    sources:   './contracts',
    tests:     './test',
    cache:     './cache',
    artifacts: './artifacts',
  },
};

export default config;
