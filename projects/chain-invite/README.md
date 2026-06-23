# ChainInvite

ChainInvite is now a ChainPass subproject under `projects/chain-invite`.

ChainInvite is a blockchain-based event invitation and QR check-in dApp. It lets an event organizer create events on Ethereum Sepolia, invite wallet addresses, issue QR codes to guests, and perform on-site check-in with either the organizer wallet or an approved scanner wallet.

The project contains two invite models:

- **Standard invites**: the contract stores whether a wallet address is invited and whether it has already checked in.
- **NFT invites**: each invite mints a non-transferable ERC-721 ticket to the guest wallet. Check-in validates token ownership and marks the ticket as used.

Both models are implemented as a Sepolia MVP and are exposed through a Next.js frontend.

## Purpose

The project demonstrates how an event access workflow can be moved onto a public blockchain while keeping the actual user journey familiar:

1. An organizer creates an event.
2. The organizer invites guest wallet addresses.
3. A guest connects their wallet and receives a QR code.
4. A scanner reads the QR code at the venue.
5. The scanner submits an on-chain check-in transaction.
6. The invite becomes invalid after successful check-in.

The core goal is to make invitations verifiable, single-use, and auditable without relying on a centralized guest-list database as the source of truth.

## Current Deployments

### Standard Contract

- Network: Sepolia
- Chain ID: `11155111`
- Address: `0x1fbeac0ceb060d39ab251eb39a0487c0ba2f2c1b`
- Deployment block: `11097427`
- Etherscan: <https://sepolia.etherscan.io/address/0x1fbeac0ceb060d39ab251eb39a0487c0ba2f2c1b>

### NFT Contract

- Network: Sepolia
- Chain ID: `11155111`
- Address: `0x2993789b32cdbee343c3f2ee6371f39e824b6f61`
- Deployment block: `11100949`
- Etherscan: <https://sepolia.etherscan.io/address/0x2993789b32cdbee343c3f2ee6371f39e824b6f61>

## Tech Stack

- Solidity `^0.8.24`
- OpenZeppelin Contracts
- Hardhat 3
- TypeScript
- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- wagmi 3
- viem 2
- MetaMask / injected wallet connector
- Sepolia testnet
- `qrcode` for QR generation
- `html5-qrcode` for camera-based QR scanning

## Project Structure

```text
.
├── contracts/
│   ├── contracts/
│   │   ├── ChainInvite.sol       # Standard wallet-address invite contract
│   │   └── ChainInviteNFT.sol    # Soulbound ERC-721 ticket invite contract
│   ├── scripts/
│   │   ├── deploy.ts             # Deploys ChainInvite
│   │   └── deploy-nft.ts         # Deploys ChainInviteNFT
│   ├── test/
│   │   ├── ChainInvite.test.ts
│   │   └── ChainInviteNFT.test.ts
│   ├── hardhat.config.ts
│   ├── package.json
│   └── tsconfig.json
├── web/
│   ├── app/                  # Next.js routes, API routes, layout, providers
│   ├── components/           # Shared UI components
│   ├── lib/                  # Contract ABIs, wagmi config, formatting, indexing
│   └── package.json
├── docs/                     # Technology notes and screenshots
├── package.json              # npm workspace root and shared scripts
├── package-lock.json         # workspace lockfile
└── README.md
```

`chain-invite` is an npm workspace. The `contracts/` package owns smart contract compilation, testing, deployment, Hardhat artifacts, and contract environment variables. The `web/` package is a separate Next.js application that talks to the deployed contracts.

## Smart Contracts

### `ChainInvite`

`contracts/contracts/ChainInvite.sol` is the standard invite contract.

It stores:

- event metadata: name, description, start time, organizer, active status
- invited guests per event
- checked-in guests per event
- approved scanner wallets per event

The first event ID is `1`, and `eventCounter` increments each time an organizer creates an event.

Important functions:

- `createEvent(name, description, startTime)`: creates an active event owned by `msg.sender`.
- `inviteGuest(eventId, guest)`: invites one guest wallet.
- `inviteMany(eventId, guests)`: invites several guests in one transaction.
- `setScanner(eventId, scanner, allowed)`: grants or revokes scanner permission.
- `checkIn(eventId, guest)`: checks in an invited guest. Only the organizer or an approved scanner may call it.
- `isValidInvite(eventId, guest)`: returns true when the event is active, the guest is invited, and the guest has not checked in yet.
- `deleteEvent(eventId)`: performs a soft delete by marking the event inactive.

The contract emits events for UI reconstruction:

- `EventCreated`
- `EventDeleted`
- `GuestInvited`
- `ScannerUpdated`
- `GuestCheckedIn`

Because Solidity mappings are not iterable, the frontend cannot ask the contract for "all guests" directly. It reconstructs guest and scanner lists from emitted logs.

### `ChainInviteNFT`

`contracts/contracts/ChainInviteNFT.sol` extends the same event model with ERC-721 ticketing.

Each invite mints one ticket NFT to the guest:

- token name: `ChainInvite Ticket`
- token symbol: `CINV`
- token metadata: returned as an on-chain `data:application/json;base64,...` URI
- token image: embedded SVG data URI
- transfer behavior: soulbound, so tokens cannot be transferred after minting

Additional NFT-specific state:

- `nextTokenId`: auto-incrementing token ID
- `tokenEvent[tokenId]`: event connected to a ticket
- `tokenUsed[tokenId]`: whether a ticket has already checked in
- `guestToken[eventId][guest]`: guest wallet to token ID lookup

Important differences from the standard contract:

- `createEvent` includes `endTime`. `0` means no expiry.
- `inviteGuest` mints and returns a token ID.
- duplicate invites for the same event and guest are rejected.
- `checkIn(eventId, guest, tokenId)` validates that the token belongs to the event, is owned by the guest, is not expired, and has not been used.
- transfers are blocked by overriding OpenZeppelin's `_update` hook and allowing only minting and burning.

## Frontend Application

The frontend lives in `web/` and uses the Next.js App Router.

### Main Routes

| Route | Purpose |
|---|---|
| `/` | Wallet dashboard showing organized, invited, and scannable events |
| `/admin/events/new` | Create a standard event |
| `/admin/events/[id]` | Manage a standard event, invite guests, approve scanners |
| `/invite/[eventId]` | Guest-facing standard invite page and QR code |
| `/scanner/[eventId]` | Standard QR scanner and check-in page |
| `/nft/admin/events/new` | Create an NFT ticket event |
| `/nft/admin/events/[id]` | Manage an NFT event |
| `/nft/invite/[eventId]` | Guest-facing NFT invite page and QR code |
| `/nft/scanner/[eventId]` | NFT QR scanner and token check-in page |

`/admin` and `/nft/admin` redirect back to `/`, so the wallet dashboard is the main console.

### Wallet and Network Handling

The app uses wagmi with the injected wallet connector, so MetaMask or another injected wallet is expected. Sepolia is the only configured chain.

When the connected wallet is on the wrong network, the UI shows a Sepolia switch action. Contract reads and writes are configured for Sepolia through wagmi and viem.

### QR Payloads

Standard invite QR payload:

```json
{
  "eventId": "1",
  "guest": "0x..."
}
```

NFT invite QR payload:

```json
{
  "version": "chaininvite-nft-v1",
  "eventId": "1",
  "guest": "0x...",
  "tokenId": "1"
}
```

The scanner pages parse the QR JSON, verify that the QR belongs to the scanner's current event, read current invite validity from the contract, and then submit the check-in transaction.

Camera access requires `localhost` or HTTPS.

## Server-Side Event Index

The project includes a small server-side indexer in `web/lib/server`.

It exists because contract mappings cannot be enumerated. Instead of having every browser scan historical logs, the app uses Next.js API routes to build and read a local event index.

### Indexed Data

For both standard and NFT variants, the index stores:

- guests invited to each event
- scanner permission updates
- checked-in guests
- soft-deleted event state
- the last indexed block cursor
- the last refresh timestamp

For NFT invites, the guest index also stores `tokenId`.

### Cache File

During local development, the index is stored in:

```text
web/.chaininvite-cache.json
```

The file is written atomically and split into two namespaces:

- `base`
- `nft`

### API Routes

| Route | Purpose |
|---|---|
| `GET /api/events/[id]?variant=base` | Refreshes and returns indexed state for one standard event |
| `GET /api/events/[id]?variant=nft` | Refreshes and returns indexed state for one NFT event |
| `GET /api/wallet/[address]/events` | Returns organized, invited, and scannable events for a wallet |
| `GET /api/refresh` | Refreshes both indexes |
| `POST /api/refresh?variant=nft&force=true&confirmations=0` | Forces an index refresh for a variant |

The indexer reads only confirmed blocks by default and uses a lock to avoid duplicate refreshes.

## Installation

Install all workspace dependencies from the workspace root:

```bash
npm install
```

## Environment Variables

### `contracts/.env`

Used by Hardhat deployment scripts.

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=0xYOUR_TEST_WALLET_PRIVATE_KEY
```

`PRIVATE_KEY` must be a private key for a test wallet only. Do not commit private keys.

### `web/.env.local`

Used by the Next.js app.

```env
NEXT_PUBLIC_CHAININVITE_ADDRESS=0x1fbeac0ceb060d39ab251eb39a0487c0ba2f2c1b
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAININVITE_DEPLOYMENT_BLOCK=11097427

NEXT_PUBLIC_CHAININVITE_NFT_ADDRESS=0x2993789b32cdbee343c3f2ee6371f39e824b6f61
NEXT_PUBLIC_CHAININVITE_NFT_DEPLOYMENT_BLOCK=11100949

NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
SERVER_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

INDEX_CONFIRMATIONS=5
INDEX_REFRESH_TTL_MS=30000
INDEX_RPC_DELAY_MS=350
INDEX_RPC_RETRY_DELAY_MS=1500
LOG_BLOCK_RANGE=9999
# Optional browser-exposed fallback kept for compatibility:
NEXT_PUBLIC_LOG_BLOCK_RANGE=9999
```

`NEXT_PUBLIC_SEPOLIA_RPC_URL` is exposed to the browser. `SERVER_SEPOLIA_RPC_URL` is used by the API/indexer and is the better place for private RPC provider credentials. Prefer `LOG_BLOCK_RANGE` for server-side indexing; `NEXT_PUBLIC_LOG_BLOCK_RANGE` is only a compatibility fallback.

If no RPC URL is configured, the frontend falls back to the public Sepolia RPC endpoint `https://ethereum-sepolia-rpc.publicnode.com`.

## Commands

### Contracts

Compile contracts:

```bash
npm run compile
```

Run contract tests:

```bash
npm test
```

Deploy the standard contract to Sepolia:

```bash
npm run deploy:sepolia
```

Deploy the NFT contract to Sepolia:

```bash
npm run deploy:nft:sepolia
```

The deploy scripts print the deployed address, transaction hash, deployment block, and the environment variables to copy into `web/.env.local`.

### Frontend

Start the development server:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Default development URL:

```text
http://localhost:3000
```

## Demo Flow

### Standard Invite Flow

1. Start the frontend and open `http://localhost:3000`.
2. Connect MetaMask.
3. Switch to Sepolia if prompted.
4. Create an event at `/admin/events/new`.
5. Open the event management page from the dashboard.
6. Invite a guest wallet address.
7. Optionally approve a separate scanner wallet.
8. Open `/invite/[eventId]` using the guest wallet.
9. Confirm that the QR code appears.
10. Open `/scanner/[eventId]` using the organizer or scanner wallet.
11. Start the camera and scan the guest QR.
12. Submit the check-in transaction.
13. Refresh the invite page and confirm that the invite is no longer valid.

### NFT Invite Flow

1. Create an NFT event at `/nft/admin/events/new`.
2. Invite a guest from the NFT event management page.
3. The contract mints a soulbound ERC-721 ticket to the guest wallet.
4. Open `/nft/invite/[eventId]` using the guest wallet.
5. The QR code includes the guest wallet and `tokenId`.
6. Scan it at `/nft/scanner/[eventId]`.
7. The contract checks ownership, event match, expiry, and token usage.
8. After check-in, `tokenUsed[tokenId]` becomes true and the QR is invalid.

## Testing Coverage

The test suite covers the two contracts.

`ChainInvite.test.ts` verifies:

- deployment
- event creation
- empty event name rejection
- single and batch invites
- organizer-only permissions
- scanner permissions
- check-in authorization
- duplicate check-in rejection
- invite validity before and after check-in
- event soft deletion behavior

`ChainInviteNFT.test.ts` verifies:

- ERC-721 name, symbol, and token ID initialization
- minting invite tickets
- duplicate invite rejection
- batch invites with distinct tokens
- token-to-event mapping
- token ownership based check-in
- scanner check-in
- soulbound transfer blocking
- no-expiry and expired invite behavior
- invalid event validity windows
- token URI metadata generation

## Deployment to Vercel

The Next.js application is inside `web/`, so the Vercel project root must be `web`.

Recommended settings:

- Framework Preset: `Next.js`
- Root Directory: `web`
- Install Command: `npm install`
- Build Command: `npm run build`

CLI deployment:

```bash
cd web
npx vercel login
npx vercel deploy --prod
```

Add the `web/.env.local` variables to the Vercel project's environment settings.

For production, use a reliable RPC provider for `SERVER_SEPOLIA_RPC_URL`. Public RPC endpoints may rate-limit historical log reads.

## Design Notes and Limitations

- This is an MVP on Sepolia, not a production mainnet deployment.
- Guest lists and scanner lists are reconstructed from logs because mappings are not iterable.
- Historical log reads are chunked by `LOG_BLOCK_RANGE`.
- The current event logs do not index `eventId` or wallet fields, so log filtering is broader than ideal.
- A future deployment should use indexed Solidity event parameters such as `event GuestInvited(uint256 indexed eventId, address indexed guest)`.
- The local JSON index is suitable for development. A hosted deployment should move the index to a durable shared store such as Redis, Vercel KV, or another database.
- QR payloads are not cryptographic signatures. The security boundary is the on-chain validation during check-in.
- Standard invites are wallet-address based. NFT invites add a token identity but still require ownership validation at check-in.
- Camera scanning works only in secure browser contexts: HTTPS or `localhost`.

## Documentation

Additional technology notes are available in `docs/`:

- Solidity
- Hardhat
- Ethereum Sepolia
- MetaMask
- Next.js
- TypeScript
- wagmi
- viem
- Tailwind CSS
- QR codes
- NFT invite direction

Screenshots are stored in `docs/screenshots/`.
