---
name: viem
description: Use this skill when implementing or reviewing viem/wagmi-based Ethereum contract integration in the ChainPass Next.js apps, especially the ChainEvents paid ticketing frontend.
---

# Viem + Wagmi for ChainEvents

Use this skill when wiring the `projects/chain-events/web` Next.js app to the `projects/chain-events/contracts/contracts/ChainEvents.sol` contract.

The goal is to replace mock UI data with Sepolia on-chain reads, writes, and event-derived lists while following the working ChainInvite frontend patterns.

## Project Pattern

Follow the ChainInvite web structure:

- `lib/wagmi.ts`: wagmi config, Sepolia chain, injected wallet connector, RPC transport, React Query client defaults.
- `app/providers.tsx`: client component wrapping the app with `WagmiProvider` and `QueryClientProvider`.
- `lib/contract.ts`: ChainEvents contract address, deployment block, chain id, and `as const` ABI.
- `lib/logs.ts`: helper for splitting historical event reads into safe block ranges.
- `lib/server/event-indexer.ts`: server-only historical log indexer using `createPublicClient`, `http`, and `getContractEvents`.

Keep frontend contract integration small and explicit. Prefer typed `as const` ABI objects over untyped JSON imports unless the build already generates typed ABIs.

## Required Web Dependencies

The ChainEvents web app needs these runtime dependencies:

```bash
npm install wagmi viem @tanstack/react-query
```

Run the command from `projects/chain-events/web`.

## Environment Variables

Use public variables only for data that is safe in the browser:

```env
NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS=
NEXT_PUBLIC_CHAIN_EVENTS_DEPLOYMENT_BLOCK=
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

Use server-only RPC variables for indexers/API routes:

```env
SERVER_SEPOLIA_RPC_URL=
SEPOLIA_RPC_URL=
LOG_BLOCK_RANGE=9999
INDEX_CONFIRMATIONS=5
INDEX_REFRESH_TTL_MS=30000
INDEX_RPC_DELAY_MS=350
INDEX_RPC_RETRY_DELAY_MS=1500
```

Never expose private keys through `NEXT_PUBLIC_*`.

## Wagmi Setup

Use the ChainInvite setup as the baseline:

```ts
import { QueryClient } from "@tanstack/react-query";
import { injected } from "@wagmi/core";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

const sepoliaRpcUrl =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  ssr: true,
  transports: {
    [sepolia.id]: http(sepoliaRpcUrl),
  },
});

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });
}
```

Add a root provider in `app/providers.tsx`, then include it in `app/layout.tsx`. The provider must be a client component.

## Contract Module

Create `projects/chain-events/web/lib/contract.ts`.

It should export:

- `chainEventsAddress` as `Address`
- `hasChainEventsAddress`
- `chainEventsChainId`
- `chainEventsDeploymentBlock`
- `chainEventsAbi`

Validate configured addresses with `isAddress` from `viem`.

The ABI must include at least:

- Events: `EventCreated`, `EventDeleted`, `TicketPurchased`, `ScannerUpdated`, `TicketCheckedIn`
- Reads: `eventCounter`, `nextTokenId`, `getEvent`, `ownerOf`, `tokenEvent`, `tokenUsed`, `scannerAllowed`, `isValidTicket`, `tokenURI`
- Writes: `createEvent`, `buyTicket`, `setScanner`, `checkIn`, `deleteEvent`

Keep `chainEventsAbi` declared `as const` so wagmi and viem infer argument and return types.

## Value and Time Conversion

Use viem utilities instead of manual decimal math:

- `parseEther(ticketPriceInput)` for ETH string -> wei `bigint`
- `formatEther(ticketPriceWei)` for wei `bigint` -> display ETH string
- `isAddress(value)` for treasury/scanner validation

Convert `datetime-local` values to Unix seconds as `bigint`:

```ts
function toUnixSeconds(value: string) {
  return BigInt(Math.floor(new Date(value).getTime() / 1000));
}
```

Do not serialize raw `bigint` values through JSON without converting them to strings first.

## Network and Wallet Guards

Every transaction screen should handle:

- Wallet disconnected
- Wrong network
- Sepolia switch pending
- Transaction signature pending
- Transaction confirmation pending
- Transaction success
- Transaction failure

Use:

- `useAccount`
- `useChainId`
- `useSwitchChain`
- `useWriteContract`
- `useWaitForTransactionReceipt`

Pass `chainId: sepolia.id` to writes.

## Reads

Use `useReadContract` or `useReadContracts` in client components for current contract state:

- Event detail: `getEvent(eventId)`
- Buyer ticket owner: `ownerOf(tokenId)`
- Ticket event relation: `tokenEvent(tokenId)`
- Check-in state: `tokenUsed(tokenId)`
- Scanner permission: `scannerAllowed(eventId, address)`
- Validity check: `isValidTicket(eventId, tokenId)`

Use viem `createPublicClient` in server-only indexers and API routes. Public reads do not require gas.

Prefer `useReadContracts` for event detail pages where several state values are needed together.

## Writes

Use `useWriteContract` for user-signed writes and `useWaitForTransactionReceipt` to drive UI state.

### Create Paid Event

Call:

```ts
writeContract({
  address: chainEventsAddress,
  abi: chainEventsAbi,
  functionName: "createEvent",
  args: [
    name.trim(),
    description.trim(),
    toUnixSeconds(startTime),
    toUnixSeconds(endTime),
    parseEther(ticketPrice),
    BigInt(maxSupply),
    treasuryAddress,
  ],
  chainId: sepolia.id,
});
```

Validate before writing:

- name is non-empty
- start/end are present
- end is not before start
- ticket price is greater than zero
- max supply is a positive integer
- treasury is a valid address
- wallet is connected and on Sepolia

### Buy Ticket

Read `ticketPrice` from `getEvent(eventId)` and call:

```ts
writeContract({
  address: chainEventsAddress,
  abi: chainEventsAbi,
  functionName: "buyTicket",
  args: [eventId],
  value: ticketPrice,
  chainId: sepolia.id,
});
```

Make the UX clear: the buyer pays the ticket price plus transaction gas. The treasury receives the ticket price; gas is paid to the network.

Block or warn for inactive, ended, and sold-out events before opening the wallet signature.

### Scanner Management

Organizer controls:

```ts
writeContract({
  address: chainEventsAddress,
  abi: chainEventsAbi,
  functionName: "setScanner",
  args: [eventId, scannerAddress, allowed],
  chainId: sepolia.id,
});
```

Validate scanner address with `isAddress`.

### Check-In

Scanner/organizer action:

```ts
writeContract({
  address: chainEventsAddress,
  abi: chainEventsAbi,
  functionName: "checkIn",
  args: [eventId, tokenId],
  chainId: sepolia.id,
});
```

Before writing, read enough state to show a useful validation result:

- `tokenEvent(tokenId) === eventId`
- `ownerOf(tokenId)` resolves to the current attendee
- `tokenUsed(tokenId) === false`
- event is active
- current time is inside the event window
- connected wallet is organizer or approved scanner

## Simulation

For risky writes, especially `buyTicket` and `checkIn`, prefer `useSimulateContract` or `publicClient.simulateContract` before `writeContract`.

Simulation is useful for surfacing revert reasons before the wallet transaction is sent. It does not change chain state and does not require gas. For payable calls, include the same `value` that the real write will send.

## Event Indexing

Use historical logs to build dashboard lists:

- Events I organize: `EventCreated`, then filter by organizer.
- Tickets I own: `TicketPurchased`, then confirm current ownership with `ownerOf(tokenId)` because tickets are transferable.
- Events I can scan: `ScannerUpdated`, then filter by scanner and latest permission value.
- Sold tickets: `TicketPurchased`.
- Check-in status: `TicketCheckedIn` and `tokenUsed(tokenId)`.
- Deactivated events: `EventDeleted`.

Use `publicClient.getContractEvents` with:

- `address`
- `abi`
- `eventName`
- `fromBlock`
- `toBlock`
- `strict: true`

Read logs in chunks using a `getContractEventsInBlockRanges` helper to avoid RPC block-range limits. Sort patches by `blockNumber` and `logIndex` before merging.

Use a confirmation delay before indexing latest logs to reduce reorg risk.

## Buyer-Owned Tickets

For MVP, reconstruct ticket ownership like this:

1. Index `TicketPurchased` logs from deployment block.
2. For each purchased token ID, call `ownerOf(tokenId)`.
3. Keep tickets where current owner matches the connected wallet.
4. Call `getEvent(eventId)` and `tokenUsed(tokenId)` to render ticket metadata/status.

Do not assume the original buyer is still the attendee, because MVP tickets are transferable.

## QR Payload

Use the project payload shape:

```json
{
  "version": "chainpass-events-v1",
  "eventId": "1",
  "tokenId": "1"
}
```

Scanner pages should parse this payload, validate `version`, convert IDs to `bigint`, then run the read validations before enabling check-in.

## Error Handling

Use concise user-facing messages, but keep raw errors available for debugging.

Common cases:

- invalid address input
- wrong chain
- insufficient funds for ticket price plus gas
- wrong ticket price because event price changed
- event inactive, ended, not started, or sold out
- token does not exist
- token belongs to another event
- token already checked in
- wallet lacks scanner permission

If using viem errors directly, inspect `BaseError` and nested revert errors instead of string matching whenever practical.

## Documentation Links

- viem getting started: https://viem.sh/docs/getting-started
- viem `readContract`: https://viem.sh/docs/contract/readContract
- viem `writeContract`: https://viem.sh/docs/contract/writeContract
- viem `simulateContract`: https://viem.sh/docs/contract/simulateContract
- viem `getContractEvents`: https://viem.sh/docs/contract/getContractEvents
- wagmi React getting started: https://wagmi.sh/react/getting-started
