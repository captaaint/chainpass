import { NextResponse } from "next/server";
import { createPublicClient, http, isAddress, type Address, type Log } from "viem";
import { sepolia } from "viem/chains";

import {
  chainEventsAbi,
  chainEventsAddress,
  chainEventsDeploymentBlock,
  hasChainEventsAddress,
} from "@/lib/contract";
import { getBlockRanges } from "@/lib/logs";
import type {
  ChainEventRecord,
  DashboardData,
  ScannerAssignmentRecord,
  TicketRecord,
} from "@/lib/chain-events-format";

export const dynamic = "force-dynamic";

const serverRpcUrl =
  process.env.SERVER_SEPOLIA_RPC_URL ??
  process.env.SEPOLIA_RPC_URL ??
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

const logBlockRange = BigInt(process.env.LOG_BLOCK_RANGE ?? "9999");
const indexConfirmations = BigInt(process.env.INDEX_CONFIRMATIONS ?? "5");
const chainInviteProbeAbi = [
  {
    type: "function",
    name: "isValidInvite",
    stateMutability: "view",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "guest", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

type EventDataTuple = readonly [
  string,
  string,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  Address,
  Address,
  boolean,
];
type EventDataObject = {
  name: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  ticketPrice: bigint;
  maxSupply: bigint;
  sold: bigint;
  organizer: Address;
  treasury: Address;
  active: boolean;
};
type EventData = EventDataTuple | EventDataObject;
type CreatedLog = { args: { eventId?: bigint; organizer?: Address } };
type DeletedLog = { args: { eventId?: bigint } };
type TicketLog = { args: { tokenId?: bigint } };
type ScannerLog = { args: { eventId?: bigint; scanner?: Address; allowed?: boolean } };

function sameAddress(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function getEventField<T>(eventData: EventData, index: number, key: keyof EventDataObject) {
  return (
    Array.isArray(eventData)
      ? (eventData as EventDataTuple)[index]
      : (eventData as EventDataObject)[key]
  ) as T;
}

function asRecord(eventId: bigint, eventData: EventData): ChainEventRecord {
  return {
    id: eventId.toString(),
    name: getEventField<string>(eventData, 0, "name"),
    description: getEventField<string>(eventData, 1, "description"),
    startTime: getEventField<bigint>(eventData, 2, "startTime").toString(),
    endTime: getEventField<bigint>(eventData, 3, "endTime").toString(),
    ticketPrice: getEventField<bigint>(eventData, 4, "ticketPrice").toString(),
    maxSupply: getEventField<bigint>(eventData, 5, "maxSupply").toString(),
    sold: getEventField<bigint>(eventData, 6, "sold").toString(),
    organizer: getEventField<Address>(eventData, 7, "organizer"),
    treasury: getEventField<Address>(eventData, 8, "treasury"),
    active: getEventField<boolean>(eventData, 9, "active"),
  };
}

function sortLogs<TLog extends Log>(logs: TLog[]) {
  return logs.sort((left, right) => {
    const leftBlock = left.blockNumber ?? BigInt(0);
    const rightBlock = right.blockNumber ?? BigInt(0);

    if (leftBlock === rightBlock) {
      return (left.logIndex ?? 0) - (right.logIndex ?? 0);
    }

    return leftBlock < rightBlock ? -1 : 1;
  });
}

export async function GET(request: Request) {
  const walletAddress = new URL(request.url).searchParams.get("address");

  if (!walletAddress || !isAddress(walletAddress)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const emptyData: DashboardData = {
    configured: hasChainEventsAddress,
    organizedEvents: [],
    tickets: [],
    scannerAssignments: [],
  };

  if (!hasChainEventsAddress || chainEventsDeploymentBlock === BigInt(0)) {
    return NextResponse.json(emptyData);
  }

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(serverRpcUrl),
  });

  const latestBlock = await publicClient.getBlockNumber();
  try {
    await publicClient.readContract({
      address: chainEventsAddress,
      abi: chainEventsAbi,
      functionName: "nextTokenId",
    });
  } catch {
    let mismatchDetail =
      "Configured address does not match the current ChainEvents ABI. Check NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS.";

    try {
      await publicClient.readContract({
        address: chainEventsAddress,
        abi: chainInviteProbeAbi,
        functionName: "isValidInvite",
        args: [BigInt(1), "0x0000000000000000000000000000000000000001"],
      });
      mismatchDetail =
        "Configured address does not match the current ChainEvents ABI. Check NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS.";
    } catch {
      // Keep the generic ABI mismatch detail when the address is not identifiable.
    }

    return NextResponse.json({
      ...emptyData,
      compatible: false,
      error: mismatchDetail,
      latestBlock: latestBlock.toString(),
      fromBlock: chainEventsDeploymentBlock.toString(),
    } satisfies DashboardData);
  }

  const toBlock =
    latestBlock > chainEventsDeploymentBlock + indexConfirmations
      ? latestBlock - indexConfirmations
      : latestBlock;

  if (toBlock < chainEventsDeploymentBlock) {
    return NextResponse.json({
      ...emptyData,
      latestBlock: latestBlock.toString(),
      fromBlock: chainEventsDeploymentBlock.toString(),
    });
  }

  async function getLogs(eventName: "EventCreated" | "EventDeleted" | "TicketPurchased" | "ScannerUpdated") {
    const ranges = getBlockRanges(chainEventsDeploymentBlock, toBlock, logBlockRange);
    const logs = [];

    for (const range of ranges) {
      const rangeLogs = await publicClient.getContractEvents({
        address: chainEventsAddress,
        abi: chainEventsAbi,
        eventName,
        fromBlock: range.fromBlock,
        toBlock: range.toBlock,
        strict: true,
      });
      logs.push(...rangeLogs);
    }

    return sortLogs(logs);
  }

  const [createdLogs, deletedLogs, ticketLogs, scannerLogs] = await Promise.all([
    getLogs("EventCreated"),
    getLogs("EventDeleted"),
    getLogs("TicketPurchased"),
    getLogs("ScannerUpdated"),
  ]);
  const createdEvents = createdLogs as CreatedLog[];
  const deletedEvents = deletedLogs as DeletedLog[];
  const ticketEvents = ticketLogs as TicketLog[];
  const scannerEvents = scannerLogs as ScannerLog[];

  const deletedEventIds = new Set(
    deletedEvents.map((log) => log.args.eventId?.toString()).filter(Boolean),
  );

  async function readEvent(eventId: bigint) {
    try {
      const eventData = (await publicClient.readContract({
        address: chainEventsAddress,
        abi: chainEventsAbi,
        functionName: "getEvent",
        args: [eventId],
      })) as EventData;

      return asRecord(eventId, eventData);
    } catch {
      return null;
    }
  }

  const organizedEventIds = [
    ...new Set(
      createdEvents
        .filter((log) => log.args.organizer && sameAddress(log.args.organizer, walletAddress))
        .map((log) => log.args.eventId)
        .filter((eventId): eventId is bigint => typeof eventId === "bigint"),
    ),
  ];

  const organizedEvents = (
    await Promise.all(organizedEventIds.map((eventId) => readEvent(eventId)))
  ).filter((event): event is ChainEventRecord => Boolean(event));

  const purchasedTokenIds = [
    ...new Set(
      ticketEvents
        .map((log) => log.args.tokenId)
        .filter((tokenId): tokenId is bigint => typeof tokenId === "bigint"),
    ),
  ];

  const tickets: TicketRecord[] = [];
  for (const tokenId of purchasedTokenIds) {
    try {
      const owner = await publicClient.readContract({
        address: chainEventsAddress,
        abi: chainEventsAbi,
        functionName: "ownerOf",
        args: [tokenId],
      });

      if (!sameAddress(owner, walletAddress)) {
        continue;
      }

      const [eventId, used] = await Promise.all([
        publicClient.readContract({
          address: chainEventsAddress,
          abi: chainEventsAbi,
          functionName: "tokenEvent",
          args: [tokenId],
        }),
        publicClient.readContract({
          address: chainEventsAddress,
          abi: chainEventsAbi,
          functionName: "tokenUsed",
          args: [tokenId],
        }),
      ]);
      const event = await readEvent(eventId);

      if (event) {
        tickets.push({
          tokenId: tokenId.toString(),
          eventId: eventId.toString(),
          owner,
          used,
          event,
        });
      }
    } catch {
      // Burned or nonexistent tokens should not block the rest of the wallet data.
    }
  }

  const scannerEventStates = new Map<string, boolean>();
  for (const log of scannerEvents) {
    const { eventId, scanner, allowed } = log.args;
    if (typeof eventId !== "bigint" || !scanner || !sameAddress(scanner, walletAddress)) {
      continue;
    }
    scannerEventStates.set(eventId.toString(), Boolean(allowed));
  }

  const scannerAssignments: ScannerAssignmentRecord[] = [];
  for (const [eventIdString, allowedFromLogs] of scannerEventStates) {
    if (!allowedFromLogs || deletedEventIds.has(eventIdString)) {
      continue;
    }

    const eventId = BigInt(eventIdString);
    const allowed = await publicClient.readContract({
      address: chainEventsAddress,
      abi: chainEventsAbi,
      functionName: "scannerAllowed",
      args: [eventId, walletAddress],
    });
    const event = await readEvent(eventId);

    if (allowed && event) {
      scannerAssignments.push({
        eventId: eventIdString,
        allowed,
        event,
      });
    }
  }

  return NextResponse.json({
    configured: true,
    compatible: true,
    latestBlock: latestBlock.toString(),
    fromBlock: chainEventsDeploymentBlock.toString(),
    organizedEvents,
    tickets,
    scannerAssignments,
  } satisfies DashboardData);
}
