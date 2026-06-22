import { createPublicClient, http } from "viem";
import type { Address } from "viem";
import { sepolia } from "viem/chains";

import {
  chainInviteAbi,
  chainInviteAddress,
  chainInviteDeploymentBlock,
  hasChainInviteAddress,
} from "@/lib/contract";
import {
  chainInviteNftAbi,
  chainInviteNftAddress,
  chainInviteNftDeploymentBlock,
  hasChainInviteNftAddress,
} from "@/lib/contract-nft";
import { getContractEventsInBlockRanges } from "@/lib/logs";
import {
  acquireIndexLock,
  getIndexMetadata,
  mergeEventIndexPatches,
  releaseIndexLock,
  type EventIndexVariant,
} from "@/lib/server/event-index-store";

type RawLog<TArgs> = {
  args: TArgs;
  blockNumber: bigint;
  logIndex: number;
};

type IndexPatch = Parameters<typeof mergeEventIndexPatches>[0]["patches"][number] & {
  logIndex: number;
};

const RPC_URL =
  process.env.SERVER_SEPOLIA_RPC_URL ??
  process.env.SEPOLIA_RPC_URL ??
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

const CONFIRMATIONS = BigInt(process.env.INDEX_CONFIRMATIONS ?? "5");
const REFRESH_TTL_MS = Number(process.env.INDEX_REFRESH_TTL_MS ?? "30000");
const RPC_DELAY_MS = Number(process.env.INDEX_RPC_DELAY_MS ?? "350");
const RPC_RETRY_DELAY_MS = Number(process.env.INDEX_RPC_RETRY_DELAY_MS ?? "1500");

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

const refreshPromises = new Map<EventIndexVariant, Promise<RefreshResult>>();

type RefreshResult = {
  variant: EventIndexVariant;
  skipped: boolean;
  reason?: string;
  fromBlock?: string;
  toBlock?: string;
  logCount?: number;
};

function sortPatches(patches: IndexPatch[]) {
  return patches.sort((left, right) => {
    if (left.blockNumber === right.blockNumber) {
      return left.logIndex - right.logIndex;
    }

    return left.blockNumber < right.blockNumber ? -1 : 1;
  });
}

function stripLogIndex(patches: IndexPatch[]) {
  return patches.map((patch) => ({
    eventId: patch.eventId,
    guest: patch.guest,
    scanner: patch.scanner,
    allowed: patch.allowed,
    checkedInGuest: patch.checkedInGuest,
    tokenId: patch.tokenId,
    deleted: patch.deleted,
    blockNumber: patch.blockNumber,
  }));
}

function nextStartBlock(cursor: bigint, deploymentBlock: bigint) {
  if (cursor === 0n) {
    return deploymentBlock;
  }

  return cursor + 1n > deploymentBlock ? cursor + 1n : deploymentBlock;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || message.includes("Too Many Requests");
}

function wasRecentlyRefreshed(refreshedAt: string | null) {
  return Boolean(refreshedAt && Date.now() - Date.parse(refreshedAt) < REFRESH_TTL_MS);
}

async function withRpcBackoff<T>(request: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;

      if (!isRateLimitError(error) || attempt === 2) {
        break;
      }

      await sleep(RPC_RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError;
}

async function indexBase(fromBlock: bigint, toBlock: bigint) {
  const guestLogs = await getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        withRpcBackoff(() => publicClient.getContractEvents({
          address: chainInviteAddress,
          abi: chainInviteAbi,
          eventName: "GuestInvited",
          fromBlock,
          toBlock,
          strict: true,
        })),
    }) as RawLog<{ eventId: bigint; guest: Address }>[];
  await sleep(RPC_DELAY_MS);

  const scannerLogs = await getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        withRpcBackoff(() => publicClient.getContractEvents({
          address: chainInviteAddress,
          abi: chainInviteAbi,
          eventName: "ScannerUpdated",
          fromBlock,
          toBlock,
          strict: true,
        })),
    }) as RawLog<{ eventId: bigint; scanner: Address; allowed: boolean }>[];
  await sleep(RPC_DELAY_MS);

  const checkedInLogs = await getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        withRpcBackoff(() => publicClient.getContractEvents({
          address: chainInviteAddress,
          abi: chainInviteAbi,
          eventName: "GuestCheckedIn",
          fromBlock,
          toBlock,
          strict: true,
        })),
    }) as RawLog<{ eventId: bigint; guest: Address }>[];
  await sleep(RPC_DELAY_MS);

  const deletedLogs = await getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        withRpcBackoff(() => publicClient.getContractEvents({
          address: chainInviteAddress,
          abi: chainInviteAbi,
          eventName: "EventDeleted",
          fromBlock,
          toBlock,
          strict: true,
        })),
    }) as RawLog<{ eventId: bigint }>[];

  return sortPatches([
    ...guestLogs.map((log) => ({
      eventId: log.args.eventId,
      guest: log.args.guest,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    })),
    ...scannerLogs.map((log) => ({
      eventId: log.args.eventId,
      scanner: log.args.scanner,
      allowed: log.args.allowed,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    })),
    ...checkedInLogs.map((log) => ({
      eventId: log.args.eventId,
      checkedInGuest: log.args.guest,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    })),
    ...deletedLogs.map((log) => ({
      eventId: log.args.eventId,
      deleted: true,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    })),
  ]);
}

async function indexNft(fromBlock: bigint, toBlock: bigint) {
  const guestLogs = await getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        withRpcBackoff(() => publicClient.getContractEvents({
          address: chainInviteNftAddress,
          abi: chainInviteNftAbi,
          eventName: "InviteMinted",
          fromBlock,
          toBlock,
          strict: true,
        })),
    }) as RawLog<{ eventId: bigint; guest: Address; tokenId: bigint }>[];
  await sleep(RPC_DELAY_MS);

  const scannerLogs = await getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        withRpcBackoff(() => publicClient.getContractEvents({
          address: chainInviteNftAddress,
          abi: chainInviteNftAbi,
          eventName: "ScannerUpdated",
          fromBlock,
          toBlock,
          strict: true,
        })),
    }) as RawLog<{ eventId: bigint; scanner: Address; allowed: boolean }>[];
  await sleep(RPC_DELAY_MS);

  const checkedInLogs = await getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        withRpcBackoff(() => publicClient.getContractEvents({
          address: chainInviteNftAddress,
          abi: chainInviteNftAbi,
          eventName: "GuestCheckedIn",
          fromBlock,
          toBlock,
          strict: true,
        })),
    }) as RawLog<{ eventId: bigint; guest: Address }>[];
  await sleep(RPC_DELAY_MS);

  const deletedLogs = await getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        withRpcBackoff(() => publicClient.getContractEvents({
          address: chainInviteNftAddress,
          abi: chainInviteNftAbi,
          eventName: "EventDeleted",
          fromBlock,
          toBlock,
          strict: true,
        })),
    }) as RawLog<{ eventId: bigint }>[];

  return sortPatches([
    ...guestLogs.map((log) => ({
      eventId: log.args.eventId,
      guest: log.args.guest,
      tokenId: log.args.tokenId,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    })),
    ...scannerLogs.map((log) => ({
      eventId: log.args.eventId,
      scanner: log.args.scanner,
      allowed: log.args.allowed,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    })),
    ...checkedInLogs.map((log) => ({
      eventId: log.args.eventId,
      checkedInGuest: log.args.guest,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    })),
    ...deletedLogs.map((log) => ({
      eventId: log.args.eventId,
      deleted: true,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    })),
  ]);
}

type RefreshOptions = {
  force?: boolean;
  confirmations?: bigint;
};

async function runRefreshEventIndex(
  variant: EventIndexVariant,
  options: RefreshOptions = {},
): Promise<RefreshResult> {
  const hasAddress = variant === "base" ? hasChainInviteAddress : hasChainInviteNftAddress;
  const deploymentBlock = variant === "base" ? chainInviteDeploymentBlock : chainInviteNftDeploymentBlock;

  if (!hasAddress) {
    return { variant, skipped: true, reason: "Contract address is not configured." };
  }

  const metadata = await getIndexMetadata(variant);
  if (!options.force && metadata.cursor > 0n && wasRecentlyRefreshed(metadata.refreshedAt)) {
    return { variant, skipped: true, reason: "Recently refreshed." };
  }

  const locked = await acquireIndexLock(variant);
  if (!locked) {
    return { variant, skipped: true, reason: "Indexer is already running." };
  }

  try {
    try {
      const latestBlock = await withRpcBackoff(() => publicClient.getBlockNumber());
      const confirmations = options.confirmations ?? CONFIRMATIONS;
      const confirmedBlock = latestBlock > confirmations ? latestBlock - confirmations : 0n;
      const { cursor } = await getIndexMetadata(variant);
      const fromBlock = nextStartBlock(cursor, deploymentBlock);

      if (fromBlock > confirmedBlock) {
        return {
          variant,
          skipped: false,
          fromBlock: fromBlock.toString(),
          toBlock: confirmedBlock.toString(),
          logCount: 0,
        };
      }

      const patches =
        variant === "base"
          ? await indexBase(fromBlock, confirmedBlock)
          : await indexNft(fromBlock, confirmedBlock);

      await mergeEventIndexPatches({
        variant,
        patches: stripLogIndex(patches),
        cursor: confirmedBlock,
      });

      return {
        variant,
        skipped: false,
        fromBlock: fromBlock.toString(),
        toBlock: confirmedBlock.toString(),
        logCount: patches.length,
      };
    } catch (error) {
      if (isRateLimitError(error)) {
        return { variant, skipped: true, reason: "RPC rate limit reached. Using cached data." };
      }

      throw error;
    }
  } finally {
    await releaseIndexLock(variant);
  }
}

export function refreshEventIndex(variant: EventIndexVariant, options: RefreshOptions = {}) {
  if (options.force) {
    return runRefreshEventIndex(variant, options);
  }

  const existing = refreshPromises.get(variant);
  if (existing) {
    return existing;
  }

  const refreshPromise = runRefreshEventIndex(variant, options).finally(() => {
    refreshPromises.delete(variant);
  });
  refreshPromises.set(variant, refreshPromise);
  return refreshPromise;
}

export function parseIndexVariant(value: string | null): EventIndexVariant {
  return value === "nft" ? "nft" : "base";
}

export function getEventIndexPublicClient() {
  return publicClient;
}
