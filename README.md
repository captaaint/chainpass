# ChainInvite

Blockchain-alapu esemenymeghivo es QR check-in dApp.

## Stack

- Solidity 0.8.x
- Hardhat 3
- Next.js + TypeScript
- wagmi + viem
- Sepolia testnet

## Contract

- Network: Sepolia
- Chain ID: `11155111`
- Address: `0x1fbeac0ceb060d39ab251eb39a0487c0ba2f2c1b`
- Etherscan: https://sepolia.etherscan.io/address/0x1fbeac0ceb060d39ab251eb39a0487c0ba2f2c1b

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local `.env` file:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=0xYOUR_TEST_WALLET_PRIVATE_KEY
```

Compile and test:

```bash
npm run compile
npm test
```

Deploy to Sepolia:

```bash
npm run deploy:sepolia
```
