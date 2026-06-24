import { NextResponse } from "next/server";
import { createPublicClient, http, type Address, type Log } from "viem";
import { sepolia } from "viem/chains";

import {
  chainEventsAbi,
  chainEventsAddress,
  chainEventsDeploymentBlock,
  hasChainEventsAddress,
} from "@/lib/contract";
import { getBlockRanges } from "@/lib/logs";
import type { AvailableEventsData, ChainEventRecord } from "@/lib/chain-events-format";

export const dynamic = "force-dynamic";

const serverRpcUrl =
  process.env.SERVER_SEPOLIA_RPC_URL ??
  process.env.SEPOLIA_RPC_URL ??
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

const logBlockRange = BigInt(process.env.LOG_BLOCK_RANGE ?? "9999");
const indexConfirmations = BigInt(process.env.INDEX_CONFIRMATIONS ?? "5");

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
type CreatedLog = { args: { eventId?: bigint } };
type DeletedLog = { args: { eventId?: bigint } };

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

function isBuyable(event: ChainEventRecord) {
  const now = BigInt(Math.floor(Date.now() / 1000));

  return (
    event.active &&
    BigInt(event.endTime) >= now &&
    BigInt(event.sold) < BigInt(event.maxSupply)
  );
}

export async function GET() {
  const serverTime = BigInt(Math.floor(Date.now() / 1000));
  const emptyData: AvailableEventsData = {
    configured: hasChainEventsAddress,
    serverTime: serverTime.toString(),
    events: [],
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
    return NextResponse.json({
      ...emptyData,
      compatible: false,
      error:
        "Configured address does not match the current ChainEvents ABI. Check NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS.",
      latestBlock: latestBlock.toString(),
      fromBlock: chainEventsDeploymentBlock.toString(),
    } satisfies AvailableEventsData);
  }

  const toBlock =
    latestBlock > chainEventsDeploymentBlock + indexConfirmations
      ? latestBlock - indexConfirmations
      : latestBlock;

  if (toBlock < chainEventsDeploymentBlock) {
    return NextResponse.json({
      ...emptyData,
      compatible: true,
      latestBlock: latestBlock.toString(),
      fromBlock: chainEventsDeploymentBlock.toString(),
    } satisfies AvailableEventsData);
  }

  async function getLogs(eventName: "EventCreated" | "EventDeleted") {
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

  const [createdLogs, deletedLogs] = await Promise.all([
    getLogs("EventCreated"),
    getLogs("EventDeleted"),
  ]);
  const deletedEventIds = new Set(
    (deletedLogs as DeletedLog[])
      .map((log) => log.args.eventId?.toString())
      .filter(Boolean),
  );
  const createdEventIds = [
    ...new Set(
      (createdLogs as CreatedLog[])
        .map((log) => log.args.eventId)
        .filter((eventId): eventId is bigint => typeof eventId === "bigint"),
    ),
  ];

  const events: ChainEventRecord[] = [];
  for (const eventId of createdEventIds) {
    if (deletedEventIds.has(eventId.toString())) {
      continue;
    }

    try {
      const eventData = (await publicClient.readContract({
        address: chainEventsAddress,
        abi: chainEventsAbi,
        functionName: "getEvent",
        args: [eventId],
      })) as EventData;
      const event = asRecord(eventId, eventData);

      if (isBuyable(event)) {
        events.push(event);
      }
    } catch {
      // Skip malformed or stale log entries without breaking the marketplace list.
    }
  }

  return NextResponse.json({
    configured: true,
    compatible: true,
    latestBlock: latestBlock.toString(),
    fromBlock: chainEventsDeploymentBlock.toString(),
    events: events.sort((left, right) => Number(left.startTime) - Number(right.startTime)),
    serverTime: serverTime.toString(),
  } satisfies AvailableEventsData);
}
