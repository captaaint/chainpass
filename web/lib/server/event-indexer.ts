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
  getIndexCursor,
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

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

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

async function indexBase(fromBlock: bigint, toBlock: bigint) {
  const [guestLogs, scannerLogs, checkedInLogs, deletedLogs] = await Promise.all([
    getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        publicClient.getContractEvents({
          address: chainInviteAddress,
          abi: chainInviteAbi,
          eventName: "GuestInvited",
          fromBlock,
          toBlock,
          strict: true,
        }),
    }) as Promise<RawLog<{ eventId: bigint; guest: Address }>[]>,
    getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        publicClient.getContractEvents({
          address: chainInviteAddress,
          abi: chainInviteAbi,
          eventName: "ScannerUpdated",
          fromBlock,
          toBlock,
          strict: true,
        }),
    }) as Promise<RawLog<{ eventId: bigint; scanner: Address; allowed: boolean }>[]>,
    getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        publicClient.getContractEvents({
          address: chainInviteAddress,
          abi: chainInviteAbi,
          eventName: "GuestCheckedIn",
          fromBlock,
          toBlock,
          strict: true,
        }),
    }) as Promise<RawLog<{ eventId: bigint; guest: Address }>[]>,
    getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        publicClient.getContractEvents({
          address: chainInviteAddress,
          abi: chainInviteAbi,
          eventName: "EventDeleted",
          fromBlock,
          toBlock,
          strict: true,
        }),
    }) as Promise<RawLog<{ eventId: bigint }>[]>,
  ]);

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
  const [guestLogs, scannerLogs, checkedInLogs, deletedLogs] = await Promise.all([
    getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        publicClient.getContractEvents({
          address: chainInviteNftAddress,
          abi: chainInviteNftAbi,
          eventName: "InviteMinted",
          fromBlock,
          toBlock,
          strict: true,
        }),
    }) as Promise<RawLog<{ eventId: bigint; guest: Address; tokenId: bigint }>[]>,
    getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        publicClient.getContractEvents({
          address: chainInviteNftAddress,
          abi: chainInviteNftAbi,
          eventName: "ScannerUpdated",
          fromBlock,
          toBlock,
          strict: true,
        }),
    }) as Promise<RawLog<{ eventId: bigint; scanner: Address; allowed: boolean }>[]>,
    getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        publicClient.getContractEvents({
          address: chainInviteNftAddress,
          abi: chainInviteNftAbi,
          eventName: "GuestCheckedIn",
          fromBlock,
          toBlock,
          strict: true,
        }),
    }) as Promise<RawLog<{ eventId: bigint; guest: Address }>[]>,
    getContractEventsInBlockRanges({
      fromBlock,
      toBlock,
      getEvents: ({ fromBlock, toBlock }) =>
        publicClient.getContractEvents({
          address: chainInviteNftAddress,
          abi: chainInviteNftAbi,
          eventName: "EventDeleted",
          fromBlock,
          toBlock,
          strict: true,
        }),
    }) as Promise<RawLog<{ eventId: bigint }>[]>,
  ]);

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

export async function refreshEventIndex(variant: EventIndexVariant) {
  const hasAddress = variant === "base" ? hasChainInviteAddress : hasChainInviteNftAddress;
  const deploymentBlock = variant === "base" ? chainInviteDeploymentBlock : chainInviteNftDeploymentBlock;

  if (!hasAddress) {
    return { variant, skipped: true, reason: "Contract address is not configured." };
  }

  const locked = await acquireIndexLock(variant);
  if (!locked) {
    return { variant, skipped: true, reason: "Indexer is already running." };
  }

  try {
    const latestBlock = await publicClient.getBlockNumber();
    const confirmedBlock = latestBlock > CONFIRMATIONS ? latestBlock - CONFIRMATIONS : 0n;
    const cursor = await getIndexCursor(variant);
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
  } finally {
    await releaseIndexLock(variant);
  }
}

export function parseIndexVariant(value: string | null): EventIndexVariant {
  return value === "nft" ? "nft" : "base";
}
