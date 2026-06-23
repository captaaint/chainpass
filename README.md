# ChainPass

ChainPass is an on-chain event access and ticketing workspace. It is being split into focused subprojects so the original invitation flow can stay stable while a paid ticketing line can evolve independently.

## Projects

| Project | Status | Purpose |
|---|---|---|
| [`projects/chain-invite`](projects/chain-invite) | Existing MVP | Wallet-based invitations, QR codes, scanner check-in, and an NFT invite variant on Sepolia |
| [`projects/chain-events`](projects/chain-events) | Contract MVP | Public paid event ticketing where buyers pay ETH, mint transferable NFT tickets, and use those tickets for check-in |

## Direction

The original ChainInvite app answers the question: "Can a wallet-based invite be verified and checked in on-chain?"

The next ChainEvents line answers a different question: "Can a paid event make the ticket buyer cover the purchase transaction and receive an NFT ticket that can later be checked in?"

The first ChainEvents contract milestone includes:

- public paid ticketing
- organizer-created events
- ETH ticket price
- max ticket supply
- start and end times
- treasury address per event
- buyer-paid minting through `buyTicket`
- transferable ERC-721 tickets
- token-based scanner check-in
- Hardhat deploy script
- contract tests covering purchase, transfer, treasury payment, scanner permissions, and check-in

Future milestones may add allowlists, organizer-selected transfer rules, platform fees, refunds, resale flows, or gasless UX.

## Working With Subprojects

Each subproject owns its own contracts, frontend, dependencies, commands, and documentation. Run commands from the relevant project directory.

For the existing invite app:

```bash
cd projects/chain-invite
npm install
npm test
```

For its frontend:

```bash
cd projects/chain-invite/web
npm install
npm run dev
```

For the ChainEvents contract MVP:

```bash
cd projects/chain-events
npm install
npm run compile
npm test
```
