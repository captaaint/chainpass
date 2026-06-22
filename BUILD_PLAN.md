# ChainInvite Build Plan

This file contains a short English-only implementation plan. Contract, file, and function names stay in their exact code form where precision matters.

## 0. Preparation

- Install Node.js and npm.
- Create a MetaMask test wallet.
- Get Sepolia test ETH.
- Configure a Sepolia RPC URL in `.env`.
- Check `.gitignore` so `.env`, `.env.local`, `node_modules`, `artifacts`, `cache`, and `.next` are not committed.

Done when dependencies install in both the root project and `web/`.

## 1. Contract Layer

- `ChainInvite.sol`: base event, invite, scanner, and check-in logic.
- `ChainInviteNFT.sol`: ERC-721 ticket based invite flow.
- Only the organizer can manage their own event.
- Invites are single-use.
- Events can be soft-deleted with `active = false`.
- Deleted events reject new invites, scanner updates, and check-ins.

Done when:

```bash
npm run compile
npm test
```

both pass.

## 2. Sepolia Deployment

Deploy the base contract:

```bash
npm run deploy:sepolia
```

Deploy the NFT contract:

```bash
npm run deploy:nft:sepolia
```

The scripts print:

- contract address
- deployment transaction
- deployment block
- values to copy into `web/.env.local`

Done when the new contract addresses and deployment blocks are in `web/.env.local`, and the frontend has been restarted.

## 3. Frontend Layer

- Next.js app in `web/`.
- MetaMask connection.
- Sepolia network check.
- Admin UI:
  - create event
  - list events
  - delete event
  - invite guest
  - allow or revoke scanner
- Guest page:
  - validate invite
  - generate QR code
- Scanner page:
  - read QR code
  - send check-in transaction

Done when:

```bash
cd web
npm run lint
npm run build
```

both pass.

## 4. Known Limits

- Old Sepolia contracts cannot be modified. New contract functions require a new deployment.
- Mappings are not directly iterable, so detailed guest lists currently use event logs.
- Public RPC endpoints can rate-limit `eth_getLogs`.
- A backend cache or indexer is the long-term solution.

## 5. Checklist

- Contract compiles.
- Contract tests pass.
- Frontend lint passes.
- Frontend build passes.
- `.env.local` contains the current Sepolia contract addresses.
- MetaMask is on Sepolia.
- The wallet has enough Sepolia test ETH for transactions.
