# ChainInvite

Blockchain-based event invitations and QR check-in dApp.

ChainInvite is a Sepolia MVP where an organizer wallet creates events, invites guest wallet addresses, guests receive QR codes, and an on-site scanner starts an on-chain check-in. Invites are single-use: after check-in, the same QR code is no longer valid.

## Stack

- Solidity 0.8.x
- Hardhat 3
- Next.js + TypeScript
- Tailwind CSS
- wagmi + viem
- Sepolia testnet
- MetaMask

## Features

- Smart contract with events, invited guests, scanner permissions, and check-in state
- Organizer admin UI:
  - create events
  - list own events
  - invite guests
  - allow or revoke scanners
  - delete events with soft delete
  - show check-in status
- Guest invite page:
  - connect wallet
  - check invite validity
  - generate QR code
- Scanner page:
  - camera-based QR reading on localhost or HTTPS
  - QR JSON validation
  - `isValidInvite` check before check-in
  - `checkIn` transaction
- NFT V2 routes under `/nft/admin`, `/nft/invite/[eventId]`, and `/nft/scanner/[eventId]`:
  - ERC-721 ticket minting on invite
  - QR payload with `tokenId`
  - token ownership based check-in
- Wrong-network handling with Sepolia switch action
- Transaction pending, success, and error states

## Deployed Contract

- Network: Sepolia
- Chain ID: `11155111`
- Address: `0x1fbeac0ceb060d39ab251eb39a0487c0ba2f2c1b`
- Deployment block: `11097427`
- Etherscan: https://sepolia.etherscan.io/address/0x1fbeac0ceb060d39ab251eb39a0487c0ba2f2c1b

## Deployed NFT Contract

- Network: Sepolia
- Chain ID: `11155111`
- Address: `0x2993789b32cdbee343c3f2ee6371f39e824b6f61`
- Deployment block: `11100949`
- Etherscan: https://sepolia.etherscan.io/address/0x2993789b32cdbee343c3f2ee6371f39e824b6f61

## Install

Root dependencies:

```bash
npm install
```

Frontend dependencies:

```bash
cd web
npm install
```

## Environment Variables

Root `.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=0xYOUR_TEST_WALLET_PRIVATE_KEY
```

Frontend `web/.env.local`:

```env
NEXT_PUBLIC_CHAININVITE_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAININVITE_DEPLOYMENT_BLOCK=...
NEXT_PUBLIC_CHAININVITE_NFT_ADDRESS=0x...
NEXT_PUBLIC_CHAININVITE_NFT_DEPLOYMENT_BLOCK=...
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
NEXT_PUBLIC_LOG_BLOCK_RANGE=9999
```

Never commit private keys. `PRIVATE_KEY` must only belong to a test wallet.

## Contract Commands

Compile:

```bash
npm run compile
```

Test:

```bash
npm test
```

Deploy to Sepolia:

```bash
npm run deploy:sepolia
npm run deploy:nft:sepolia
```

The deploy scripts print the contract address, deployment transaction, deployment block, and the `.env.local` values to copy.

## Frontend Commands

```bash
cd web
npm run dev
npm run build
npm run lint
```

Development URL:

```text
http://localhost:3000
```

## Vercel Deployment

The Next.js app lives in `web/`, so the Vercel project root must be `web`.

CLI deployment:

```bash
cd web
npx vercel login
npx vercel deploy --prod
```

Vercel settings:

- Framework Preset: `Next.js`
- Root Directory: `web`
- Build Command: `npm run build`
- Install Command: `npm install`

## Demo Flow

1. Open `http://localhost:3000`.
2. Connect MetaMask.
3. Switch to Sepolia if needed.
4. Organizer flow:
   - `/admin`
   - `/admin/events/new`
   - create an event
   - open event details
   - invite a guest wallet address
   - optionally allow a scanner wallet
5. Guest flow:
   - `/invite/1`
   - connect with the invited guest wallet
   - if the invite is valid, the QR code appears
6. Scanner flow:
   - `/scanner/1`
   - connect with the organizer or an allowed scanner wallet
   - start the camera
   - scan the guest QR code
   - run check-in
7. Verification:
   - the same QR becomes invalid after check-in
   - the admin event page shows the guest as checked in

## Notes

- Browser camera access requires HTTPS or localhost.
- Contract mappings are not iterable, so detail pages reconstruct guest and scanner lists from logs.
- Log reading starts from the deployment block to avoid unnecessary RPC ranges.
- The QR payload is intentionally simple JSON:

```json
{ "eventId": "1", "guest": "0x..." }
```
