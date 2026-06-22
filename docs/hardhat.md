# Hardhat

Hardhat is the smart contract development environment used in this project. It compiles Solidity, runs tests, provides local chains, and deploys contracts.

## Why ChainInvite Uses It

- One tool covers compilation, testing, and deployment.
- Local testing is fast and free.
- TypeScript support works well with the rest of the project.

## Role in ChainInvite

- `npm run compile` compiles Solidity into bytecode and ABI files.
- `npm test` runs contract tests.
- `npm run deploy:sepolia` deploys the base contract.
- `npm run deploy:nft:sepolia` deploys the NFT contract.
- Generated artifacts provide ABI data for the frontend.

## Key Terms

- ABI: JSON description of contract functions and events.
- Artifacts: generated build outputs.
- `hardhat.config.ts`: Solidity and network configuration.

## Official Documentation

- https://hardhat.org/docs/getting-started
