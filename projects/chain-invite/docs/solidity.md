# Solidity

Solidity is the smart contract language used for ChainInvite. It compiles to EVM bytecode and runs on Ethereum-compatible chains.

## Role in ChainInvite

- Store events, guests, check-in status, and scanner permissions.
- Enforce who can create, invite, scan, and delete.
- Guarantee single-use invites.
- Emit events that the frontend can read.

## Key Concepts

- `struct`: grouped data fields.
- `mapping`: key-value storage.
- `modifier` and `require`: authorization and validation.
- `event` and `emit`: on-chain logs.
- `msg.sender`: wallet that called the function.
- `view`: read-only function.

## Official Documentation

- https://docs.soliditylang.org/
