---
name: wagmi
description: Use this skill when implementing or reviewing wagmi React wallet, network, contract read/write, and transaction UX flows in the ChainPass Next.js apps, especially ChainEvents.
---

# Wagmi for ChainPass

Use this skill when wiring wallet and contract UX in `projects/chain-events/web`.

The baseline is the existing ChainInvite web app plus the general wagmi skill pattern: configure wagmi once, wrap the app with providers, use hooks in client components, and keep contract reads/writes typed through `as const` ABIs.

## ChainPass Defaults

- Target network for MVP: Sepolia.
- Wallet connector for MVP: injected wallet connector.
- Transport: `http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? public fallback)`.
- Contract module: keep address, chain id, deployment block, and ABI in `lib/contract.ts`.
- Transaction status: show wallet signature pending, confirmation pending, success, error, and Etherscan link.
- Server/indexer code should use viem clients directly; React UI code should use wagmi hooks.

## Install

Run from `projects/chain-events/web`:

```bash
npm install wagmi viem @tanstack/react-query @wagmi/core
```

`@wagmi/core` is used by the ChainInvite-style `injected` import. If you import connectors from `wagmi/connectors` instead, `@wagmi/core` does not need to be referenced directly.

## File Structure

Use this structure:

```text
app/providers.tsx
lib/wagmi.ts
lib/contract.ts
components/wallet-status.tsx
components/transaction-status.tsx
```

Only components that call wagmi hooks should be client components.

## Wagmi Config

Mirror ChainInvite:

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

For a later polished wallet modal, consider RainbowKit, but do not add it for the ChainEvents MVP unless requested.

## Providers

Create `app/providers.tsx`:

```tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { makeQueryClient, wagmiConfig } from "@/lib/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
```

Wrap the app body in `app/layout.tsx`.

## Wallet Status

Use the ChainInvite pattern:

- `useAccount()` for `address` and `isConnected`.
- `useChainId()` to detect Sepolia.
- `useConnect()` and the first injected connector for connect.
- `useDisconnect()` for disconnect.
- `useSwitchChain()` for wrong-network repair.

Always show wallet and network state somewhere persistent in the app shell.

Keep UI states explicit:

- disconnected: show connect button
- connected on Sepolia: show shortened wallet address
- connected on wrong network: show switch-to-Sepolia action
- connect/switch pending: disable relevant buttons

## Reads

Use `useReadContract` for single reads and `useReadContracts` for grouped reads.

ChainEvents reads:

- `getEvent(eventId)` for event detail.
- `ownerOf(tokenId)` for current ticket owner.
- `tokenEvent(tokenId)` to ensure a ticket belongs to the scanned event.
- `tokenUsed(tokenId)` for check-in state.
- `scannerAllowed(eventId, address)` for scanner permission.
- `isValidTicket(eventId, tokenId)` for final validation.

Recommended read options:

```ts
const result = useReadContract({
  address: chainEventsAddress,
  abi: chainEventsAbi,
  functionName: "getEvent",
  args: [eventId],
  chainId: sepolia.id,
  query: {
    enabled: Boolean(eventId),
    retry: false,
  },
});
```

Use `enabled` when args depend on wallet address, parsed QR payload, or validated route params. Use `retry: false` for reads that may revert because an event or token does not exist.

## Writes

Use `useWriteContract` plus `useWaitForTransactionReceipt`.

```ts
const {
  data: hash,
  error,
  isPending,
  writeContract,
} = useWriteContract();

const {
  isLoading: isConfirming,
  isSuccess,
} = useWaitForTransactionReceipt({ hash, chainId: sepolia.id });
```

For screens with multiple independent writes, use separate hook instances so pending/error state does not blur together. ChainInvite does this for invite and scanner writes.

Pass `chainId: sepolia.id` on every write.

## ChainEvents Write Flows

### Create Paid Event

Validate form state first, then call `createEvent`:

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

Guard for wallet connected, Sepolia, valid treasury address, positive price, positive supply, and valid dates.

### Buy Ticket

Read the ticket price from `getEvent(eventId)`, then send exact ETH value:

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

Buyer UX must say: buyer pays ticket price plus gas. The ticket price goes to the event treasury; gas goes to the network.

### Scanner Update

Organizer-only control:

```ts
writeContract({
  address: chainEventsAddress,
  abi: chainEventsAbi,
  functionName: "setScanner",
  args: [eventId, scannerAddress, allowed],
  chainId: sepolia.id,
});
```

Validate `scannerAddress` with `isAddress` before writing.

### Check-In

Scanner or organizer action:

```ts
writeContract({
  address: chainEventsAddress,
  abi: chainEventsAbi,
  functionName: "checkIn",
  args: [eventId, tokenId],
  chainId: sepolia.id,
});
```

Before enabling the button, read and display:

- token belongs to event
- token exists and has an owner
- token is not already used
- event is active and inside the valid time window
- connected wallet is organizer or approved scanner

## Transaction Status Component

Reuse the ChainInvite approach:

- no state: render nothing
- confirming: show spinner and "Transaction pending"
- success: show confirmed state
- error: show message
- hash: link to `https://sepolia.etherscan.io/tx/${hash}`

After success, refetch affected reads or call the relevant API refresh endpoint.

## Route Params and BigInt

Route params arrive as strings. Convert once:

```ts
const params = useParams<{ eventId: string }>();
const eventId = BigInt(params.eventId);
```

Validate before conversion if the route may contain arbitrary text.

Never place `bigint` directly in JSON responses or client storage. Convert to string.

## Query Refresh

For immediate UI updates after writes:

- call `refetch()` from the relevant `useReadContract`
- invalidate TanStack queries when using custom query keys
- trigger server index refresh endpoints when dashboard lists depend on historical logs

ChainInvite refreshes index-backed data after successful check-in; follow that pattern for ChainEvents ticket purchase, scanner update, event deletion, and check-in.

## Error Handling

Handle these before asking the wallet to sign:

- wallet disconnected
- wrong network
- invalid address
- missing event/token ID
- event inactive, ended, not started, or sold out
- insufficient user input for payable purchase
- missing contract address configuration

Display contract errors, but prefer project-specific messages for expected states. Keep raw `error.message` available in transaction status while developing.

## When Not To Use Wagmi

Do not use wagmi hooks in server components, API routes, or indexers. Use viem directly there.

Do not use wagmi hooks outside a `WagmiProvider`.

Do not put private RPC keys or deployer private keys in `NEXT_PUBLIC_*` values.

## Documentation Links

- TerminalSkills wagmi reference: https://github.com/TerminalSkills/skills/blob/main/skills/wagmi/SKILL.md
- wagmi getting started: https://wagmi.sh/react/getting-started
- wagmi hooks: https://wagmi.sh/react/api/hooks
- `useReadContract`: https://wagmi.sh/react/api/hooks/useReadContract
- `useWriteContract`: https://wagmi.sh/react/api/hooks/useWriteContract
- `useWaitForTransactionReceipt`: https://wagmi.sh/react/api/hooks/useWaitForTransactionReceipt
- `useSwitchChain`: https://wagmi.sh/react/api/hooks/useSwitchChain
