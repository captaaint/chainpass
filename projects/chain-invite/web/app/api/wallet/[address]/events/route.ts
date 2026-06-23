import { NextResponse, type NextRequest } from "next/server";
import type { Address } from "viem";
import { isAddress } from "viem";

import { chainInviteAbi, chainInviteAddress, hasChainInviteAddress } from "@/lib/contract";
import {
  chainInviteNftAbi,
  chainInviteNftAddress,
  hasChainInviteNftAddress,
} from "@/lib/contract-nft";
import { normalizeAddress } from "@/lib/format";
import {
  getIndexedEventIdsForGuest,
  getIndexedEventIdsForScanner,
  getIndexedEventState,
  type EventIndexVariant,
} from "@/lib/server/event-index-store";
import { getEventIndexPublicClient, refreshEventIndex } from "@/lib/server/event-indexer";

type BaseEventData = {
  name: string;
  description: string;
  startTime: bigint;
  organizer: Address;
  active: boolean;
};

type NftEventData = BaseEventData & {
  endTime: bigint;
};

const legacyNftEventAbi = [
  {
    type: "function",
    name: "getEvent",
    stateMutability: "view",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ChainInviteNFT.Event",
        components: [
          { name: "name", type: "string", internalType: "string" },
          { name: "description", type: "string", internalType: "string" },
          { name: "startTime", type: "uint256", internalType: "uint256" },
          { name: "organizer", type: "address", internalType: "address" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
  },
] as const;

type WalletEventSummary = {
  variant: EventIndexVariant;
  eventId: string;
  role: "organizer" | "guest" | "scanner";
  name: string;
  description: string;
  startTime: string;
  endTime?: string;
  organizer: Address;
  active: boolean;
  href: string;
  inviteHref: string;
  scannerHref: string;
  tokenId?: string;
  checkedIn: boolean;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;

  if (!isAddress(address)) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  try {
    await Promise.all([refreshEventIndex("base"), refreshEventIndex("nft")]);

    const wallet = address as Address;
    const [organizedBase, organizedNft, invitedBase, invitedNft, scannerBase, scannerNft] = await Promise.all([
      getOrganizedEvents("base", wallet),
      getOrganizedEvents("nft", wallet),
      getInvitedEvents("base", wallet),
      getInvitedEvents("nft", wallet),
      getScannerEvents("base", wallet),
      getScannerEvents("nft", wallet),
    ]);
    const scannable = uniqueEventsByVariantAndId([
      ...organizedBase.map((event) => ({ ...event, role: "scanner" as const })),
      ...organizedNft.map((event) => ({ ...event, role: "scanner" as const })),
      ...scannerBase,
      ...scannerNft,
    ]);

    return NextResponse.json({
      organized: [...organizedBase, ...organizedNft].sort(sortEvents),
      invited: [...invitedBase, ...invitedNft].sort(sortEvents),
      scannable: scannable.sort(sortEvents),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load wallet events." },
      { status: 500 },
    );
  }
}

async function getOrganizedEvents(
  variant: EventIndexVariant,
  wallet: Address,
): Promise<WalletEventSummary[]> {
  if ((variant === "base" && !hasChainInviteAddress) || (variant === "nft" && !hasChainInviteNftAddress)) {
    return [];
  }

  const client = getEventIndexPublicClient();
  const counter =
    variant === "base"
      ? await client.readContract({
          address: chainInviteAddress,
          abi: chainInviteAbi,
          functionName: "eventCounter",
        })
      : await client.readContract({
          address: chainInviteNftAddress,
          abi: chainInviteNftAbi,
          functionName: "eventCounter",
        });

  const eventIds = Array.from({ length: Number(counter) }, (_, index) => BigInt(index + 1));
  const summaries = await Promise.all(eventIds.map((eventId) => readEventSummary(variant, eventId, "organizer", wallet)));

  return summaries
    .filter((event): event is WalletEventSummary => event !== null)
    .filter(
      (event) =>
        event.active &&
        normalizeAddress(event.organizer) === normalizeAddress(wallet),
    );
}

async function getInvitedEvents(
  variant: EventIndexVariant,
  wallet: Address,
): Promise<WalletEventSummary[]> {
  const eventIds = await getIndexedEventIdsForGuest(variant, wallet);
  const summaries = await Promise.all(
    eventIds.map((eventId) => readEventSummary(variant, BigInt(eventId), "guest", wallet)),
  );

  return summaries
    .filter((event): event is WalletEventSummary => event !== null)
    .filter((event) => event.active);
}

async function getScannerEvents(
  variant: EventIndexVariant,
  wallet: Address,
): Promise<WalletEventSummary[]> {
  const eventIds = await getIndexedEventIdsForScanner(variant, wallet);
  const summaries = await Promise.all(
    eventIds.map((eventId) => readEventSummary(variant, BigInt(eventId), "scanner", wallet)),
  );

  return summaries
    .filter((event): event is WalletEventSummary => event !== null)
    .filter((event) => event.active);
}

async function readEventSummary(
  variant: EventIndexVariant,
  eventId: bigint,
  role: "organizer" | "guest" | "scanner",
  wallet: Address,
): Promise<WalletEventSummary | null> {
  const client = getEventIndexPublicClient();

  try {
    const eventData =
      variant === "base"
        ? ((await client.readContract({
            address: chainInviteAddress,
            abi: chainInviteAbi,
            functionName: "getEvent",
            args: [eventId],
          })) as BaseEventData)
        : await readNftEvent(eventId);

    const indexedState = await getIndexedEventState(variant, eventId.toString());
    const indexedGuest = indexedState.guests.find(
      (guest) => normalizeAddress(guest.guest) === normalizeAddress(wallet),
    );
    const checkedIn = indexedState.checkedIn.some(
      (guest) => normalizeAddress(guest) === normalizeAddress(wallet),
    );
    const endTime = isNftEventData(eventData) ? eventData.endTime.toString() : undefined;

    return {
      variant,
      eventId: eventId.toString(),
      role,
      name: eventData.name,
      description: eventData.description,
      startTime: eventData.startTime.toString(),
      ...(endTime === undefined ? {} : { endTime }),
      organizer: eventData.organizer,
      active: eventData.active && indexedState.active,
      href:
        variant === "base"
          ? `/admin/events/${eventId.toString()}`
          : `/nft/admin/events/${eventId.toString()}`,
      inviteHref:
        variant === "base"
          ? `/invite/${eventId.toString()}`
          : `/nft/invite/${eventId.toString()}`,
      scannerHref:
        variant === "base"
          ? `/scanner/${eventId.toString()}`
          : `/nft/scanner/${eventId.toString()}`,
      tokenId: indexedGuest?.tokenId,
      checkedIn,
    };
  } catch {
    return null;
  }
}

function isNftEventData(eventData: BaseEventData | NftEventData): eventData is NftEventData {
  return "endTime" in eventData && typeof eventData.endTime === "bigint";
}

async function readNftEvent(eventId: bigint): Promise<BaseEventData | NftEventData> {
  const client = getEventIndexPublicClient();

  try {
    return (await client.readContract({
      address: chainInviteNftAddress,
      abi: chainInviteNftAbi,
      functionName: "getEvent",
      args: [eventId],
    })) as NftEventData;
  } catch {
    return (await client.readContract({
      address: chainInviteNftAddress,
      abi: legacyNftEventAbi,
      functionName: "getEvent",
      args: [eventId],
    })) as BaseEventData;
  }
}

function uniqueEventsByVariantAndId(events: WalletEventSummary[]) {
  const uniqueEvents = new Map<string, WalletEventSummary>();

  for (const event of events) {
    uniqueEvents.set(`${event.variant}-${event.eventId}`, event);
  }

  return [...uniqueEvents.values()];
}

function sortEvents(left: WalletEventSummary, right: WalletEventSummary) {
  const byStartTime = Number(BigInt(right.startTime) - BigInt(left.startTime));

  if (byStartTime !== 0) {
    return byStartTime;
  }

  return Number(BigInt(right.eventId) - BigInt(left.eventId));
}
