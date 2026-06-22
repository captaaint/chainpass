# ChainInvite Scalable Reads Plan

This plan removes expensive full log scans from the browser.

## Problem

`web/app/admin/events/[id]/page.tsx` and its NFT counterpart currently build guest and scanner lists from contract event logs. This is necessary because Solidity mappings are not iterable.

Consequences:

- many `eth_getLogs` requests
- public RPC range limits or rate limits
- historical log reads may require a paid or archive-capable provider

## Goal

Add a thin server-side cache that:

- reads logs incrementally
- stores guest, scanner, and check-in state per event
- returns fast JSON to the frontend
- keeps private RPC URLs out of the browser

## Suggested Architecture

```text
Browser -> Next.js API -> KV store
                    |
                    -> server-side Sepolia RPC
```

Suggested stores:

- Upstash Redis
- Vercel KV

Required server-side environment variables:

```env
SERVER_SEPOLIA_RPC_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
INDEX_CONFIRMATIONS=5
LOG_BLOCK_RANGE=9999
```

## Data Model

- `ci:cursor`: last processed block
- `ci:event:{id}:guests`: guest list
- `ci:event:{id}:scanners`: scanner state
- `ci:event:{id}:checkedin`: checked-in guests
- `ci:event:{id}:meta`: event metadata, such as deleted status
- `ci:lock`: lock against parallel indexing

## Indexer Flow

1. Read cursor.
2. Read latest block.
3. Read only confirmed blocks.
4. Read `GuestInvited`, `ScannerUpdated`, `GuestCheckedIn`, and `EventDeleted` logs in chunks.
5. Merge state.
6. Update cursor after successful merge.

## API Routes

- `GET /api/events/{id}`: returns cached state for one event.
- `POST /api/refresh`: starts indexing.

## Frontend Change

- Event detail pages should not call `eth_getLogs` directly.
- Guest and scanner lists should come from the API.
- Successful invite or scanner updates should refresh the API data.

## Implementation Status

- Added server-side API routes for `GET /api/events/{id}` and `POST /api/refresh`.
- Added incremental log indexing for standard and NFT events.
- Added a local JSON cache fallback at `web/.chaininvite-cache.json` for development.
- Updated admin event detail pages to read guests, scanners, and check-in state from the API.
- Added server-only RPC configuration through `SERVER_SEPOLIA_RPC_URL`.

## Contract-Level Improvement

For a new deployment, index important event fields:

```solidity
event GuestInvited(uint256 indexed eventId, address indexed guest);
event ScannerUpdated(uint256 indexed eventId, address indexed scanner, bool allowed);
```

This lets RPC providers filter by event id and reduces data volume.
