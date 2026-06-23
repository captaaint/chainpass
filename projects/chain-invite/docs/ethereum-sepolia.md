# Ethereum, Sepolia, and RPC

Ethereum is a decentralized blockchain that can run smart contracts. Sepolia is an Ethereum testnet: it behaves like Ethereum, but its ETH has no real value and is used for testing.

An RPC URL is the endpoint your app uses to talk to the network. It is used to read data, send transactions, and deploy contracts.

## Why ChainInvite Uses It

- Sepolia gives realistic blockchain behavior without financial risk.
- Sepolia is well supported by wallets, faucets, and explorers.
- The same EVM concepts transfer to many other chains.

## Role in ChainInvite

- Deployed contracts live on Sepolia.
- Check-in transactions are written to Sepolia.
- The frontend reads event and invite state through RPC calls.

## Key Terms

- Gas: fee paid for state-changing transactions.
- Transaction: signed operation that changes chain state.
- Block explorer: https://sepolia.etherscan.io
- Faucet: service that gives free test ETH.

## Official Documentation

- https://ethereum.org/developers/docs/
- https://sepolia.etherscan.io
