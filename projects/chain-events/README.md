# ChainEvents

ChainEvents is the paid ticketing product inside the ChainPass monorepo.

It is separate from ChainInvite. ChainEvents is for public paid events with transferable ERC-721 ticket NFTs. Buyers pay the configured ticket price plus gas, and the ticket price is forwarded to the event treasury. Tickets can be transferred after purchase, so attendee-facing flows always check the current token owner instead of assuming the original buyer still holds the ticket.

The current MVP does not include allowlists, platform fees, refunds, resale logic, or organizer-selectable transfer rules.

## Structure

```text
chain-events/
├── contracts/
│   ├── contracts/ChainEvents.sol
│   ├── scripts/deploy.ts
│   ├── test/ChainEvents.test.ts
│   ├── hardhat.config.ts
│   └── package.json
├── web/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── .env.example
│   └── package.json
├── package.json
├── AGENTS.md
├── DESIGN.md
└── README.md
```

## Contract Model

`contracts/contracts/ChainEvents.sol` is an ERC-721 ticket contract.

Organizers create events with:

- name
- description
- start time
- end time
- ticket price
- max supply
- treasury address

Buyers call `buyTicket(eventId)` and must send exactly the configured ticket price. The contract mints one transferable ticket NFT to the buyer and forwards the ETH to the event treasury.

Check-in is token-based. The organizer or an approved scanner calls `checkIn(eventId, tokenId)`. The contract validates that:

- the token belongs to the event
- the event is active
- the event is within its start/end time window
- the token has not already been used
- the caller is the organizer or has scanner permission

Because tickets are transferable, the current token owner is treated as the attendee.

## Contract Surface

Writes:

- `createEvent(name, description, startTime, endTime, ticketPrice, maxSupply, treasury)`
- `buyTicket(eventId)` payable
- `setScanner(eventId, scanner, allowed)`
- `checkIn(eventId, tokenId)`
- `deleteEvent(eventId)`

Reads:

- `eventCounter`
- `nextTokenId`
- `getEvent`
- `ownerOf`
- `tokenEvent`
- `tokenUsed`
- `scannerAllowed`
- `isValidTicket`
- `tokenURI`

Events:

- `EventCreated`
- `EventDeleted`
- `TicketPurchased`
- `ScannerUpdated`
- `TicketCheckedIn`

## Web App

The web app lives in `web/` and uses Next.js, TypeScript, Tailwind, wagmi, and viem.

Primary routes:

- `/` - dashboard with wallet-aware organizer and ticket summaries.
- `/create-event` - create a paid event. After a successful transaction, the UI reads the `EventCreated` log and navigates to the new event details page.
- `/events` - lists available events for buyers. If the connected wallet is the organizer, it also lists that organizer's inactive or deactivated events.
- `/events/[id]` - event details, ticket purchase, organizer controls, scanner management, and QR validation.
- `/tickets` - lists tickets currently owned by the connected wallet.
- `/tickets/[tokenId]` - ticket details, QR code, status, and a link back to the event.
- `/scanner/[eventId]` - scanner-focused page for event check-in workflows.

### Event Buying

Event cards on `/events` support:

- viewing the event details page
- quick buying with a cart action

Before opening the wallet, the UI reads the latest event data from the contract and blocks purchases when the event is inactive, not started, ended, or sold out. The buy transaction sends `value: ticketPrice`; buyers still pay gas separately. Critical writes use simulation first so common reverts can be shown before submission.

Organizers do not see the buyer purchase card on their own event details page.

### Event Details

The event details page shows the deactivated state when an event has been deleted/deactivated on-chain. In that state, the deactivate button is hidden.

Organizer controls are only shown to the connected event organizer. They include scanner permission management and event deactivation controls while the event is active.

If the connected wallet is the organizer or has `scannerAllowed(eventId, wallet)`, the page also shows ticket validation controls. The validator can scan a QR code with the browser camera or paste a QR payload/token ID manually.

### Ticket Details

The ticket details page shows:

- ticket status
- current owner-aware ticket information
- event link
- QR code for check-in

The raw QR JSON is intentionally not displayed on the page.

Ticket statuses are shared across ticket cards and details:

- `Valid` for active, unused tickets within the event window
- `Checked In` after successful check-in
- `Not valid anymore` for unused tickets after the event has ended
- `Not currently valid` when the event has not started yet or is otherwise outside the valid check-in window

### QR Payload

Ticket QR codes encode:

```json
{
  "version": "chainpass-events-v1",
  "eventId": "1",
  "tokenId": "1"
}
```

Validation checks the payload version, event ID, token ID, current token owner, token/event relationship, used state, event activity, time window, and scanner permission before calling `checkIn`.

## API and Indexing

Server-side web routes use viem public clients for on-chain reads and event-log indexing. BigInts are converted to strings before JSON responses.

API routes:

- `GET /api/chain-events/events`
- `GET /api/chain-events/events?address=0x...`
- `GET /api/chain-events/dashboard?address=0x...`

The events API lists public buyable events by default. With a valid `address`, it also includes inactive/deactivated events organized by that wallet.

The dashboard API combines event logs with live contract reads. Ticket ownership is confirmed with `ownerOf(tokenId)`, and token/event data is read from the contract so transferred tickets and organizer-owned tickets are reflected correctly.

The indexer reads from `NEXT_PUBLIC_CHAIN_EVENTS_DEPLOYMENT_BLOCK` and chunks log reads with `LOG_BLOCK_RANGE`. It subtracts `INDEX_CONFIRMATIONS` from the latest block to avoid indexing unstable recent blocks.

## Environment

Contracts use `contracts/.env`:

```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=0xYOUR_TEST_WALLET_PRIVATE_KEY
```

Web uses `web/.env.local`:

```bash
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS=0xYOUR_DEPLOYED_CHAIN_EVENTS_CONTRACT
NEXT_PUBLIC_CHAIN_EVENTS_DEPLOYMENT_BLOCK=0
SERVER_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
LOG_BLOCK_RANGE=9999
INDEX_CONFIRMATIONS=5
```

`SERVER_SEPOLIA_RPC_URL` is preferred for API/indexing reads and must stay server-only. Do not expose private keys or server RPC secrets through `NEXT_PUBLIC_*` variables.

If `NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS` points to a contract that does not match the current `web/lib/contract.ts` ABI, the UI and API will report a ChainEvents ABI/address mismatch. Redeploy the current contract and update both the address and deployment block.

## Commands

Install dependencies from this subproject:

```bash
npm install
```

Compile contracts:

```bash
npm run compile
```

Run contract tests:

```bash
npm test
```

Run the web app:

```bash
npm run dev:web
```

Lint the web app:

```bash
npm run lint:web
```

Build the web app:

```bash
npm run build:web
```

Deploy to Sepolia:

```bash
npm run deploy:sepolia
```

## Deployment Notes

When the contract or ABI changes:

1. Deploy the contract from `contracts/`.
2. Copy the printed `NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS`.
3. Copy the printed `NEXT_PUBLIC_CHAIN_EVENTS_DEPLOYMENT_BLOCK`.
4. Update `web/.env.local`.
5. Update `web/lib/contract.ts` if the ABI changed.
6. Rebuild the web app and verify event creation, event listing, purchase, ticket listing, ticket details, and QR check-in.

This documentation update does not require a redeploy by itself.
