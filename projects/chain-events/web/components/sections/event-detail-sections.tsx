"use client";

import { CalendarDays, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { formatEther } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";

import {
  chainEventsAbi,
  chainEventsAddress,
  hasChainEventsAddress,
} from "@/lib/contract";
import {
  type ChainEventRecord,
  formatEventDate,
  formatEventDateTime,
  getEventStatus,
  shortenAddress,
} from "@/lib/chain-events-format";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  MetricCard,
  Panel,
} from "@/components/ui/primitives";

type EventDataTuple = readonly [
  string,
  string,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  `0x${string}`,
  `0x${string}`,
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
  organizer: `0x${string}`;
  treasury: `0x${string}`;
  active: boolean;
};
type EventData = EventDataTuple | EventDataObject;

function parseEventId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

function getEventField<T>(eventData: EventData, index: number, key: keyof EventDataObject) {
  return (
    Array.isArray(eventData)
      ? (eventData as EventDataTuple)[index]
      : (eventData as EventDataObject)[key]
  ) as T;
}

function eventFromTuple(id: bigint, eventData: EventData): ChainEventRecord {
  return {
    id: id.toString(),
    name: getEventField<string>(eventData, 0, "name"),
    description: getEventField<string>(eventData, 1, "description"),
    startTime: getEventField<bigint>(eventData, 2, "startTime").toString(),
    endTime: getEventField<bigint>(eventData, 3, "endTime").toString(),
    ticketPrice: getEventField<bigint>(eventData, 4, "ticketPrice").toString(),
    maxSupply: getEventField<bigint>(eventData, 5, "maxSupply").toString(),
    sold: getEventField<bigint>(eventData, 6, "sold").toString(),
    organizer: getEventField<`0x${string}`>(eventData, 7, "organizer"),
    treasury: getEventField<`0x${string}`>(eventData, 8, "treasury"),
    active: getEventField<boolean>(eventData, 9, "active"),
  };
}

function useEventDetail(eventIdParam: string) {
  const eventId = parseEventId(eventIdParam);

  const query = useReadContract({
    address: chainEventsAddress,
    abi: chainEventsAbi,
    functionName: "getEvent",
    args: eventId === null ? undefined : [eventId],
    chainId: sepolia.id,
    query: {
      enabled: hasChainEventsAddress && eventId !== null,
      retry: false,
    },
  });

  return {
    eventId,
    event: eventId !== null && query.data ? eventFromTuple(eventId, query.data as EventData) : null,
    ...query,
  };
}

export function EventHero({
  event,
  isLoading,
  isError,
  invalidEventId,
}: Readonly<{
  event: ChainEventRecord | null;
  isLoading: boolean;
  isError: boolean;
  invalidEventId: boolean;
}>) {
  if (!hasChainEventsAddress) {
    return (
      <Panel className="p-8 md:p-10">
        <EmptyState
          title="Contract not configured"
          detail="Set NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS to read ChainEvents event details."
        />
      </Panel>
    );
  }

  if (invalidEventId) {
    return (
      <Panel className="p-8 md:p-10">
        <EmptyState title="Invalid event ID" detail="The event route must contain a numeric ID." />
      </Panel>
    );
  }

  if (isLoading) {
    return (
      <Panel className="p-8 md:p-10">
        <EmptyState title="Loading event" detail="Reading event details from the ChainEvents contract." />
      </Panel>
    );
  }

  if (isError || !event) {
    return (
      <Panel className="p-8 md:p-10">
        <EmptyState
          title="Event not found"
          detail="The contract did not return an event for this ID."
        />
      </Panel>
    );
  }

  return (
    <Panel className="p-8 md:p-10">
      <h1 className="text-[34px] font-bold leading-[42px] tracking-[-0.02em]">
        {event.name}
      </h1>
      <div className="mt-6 flex flex-wrap gap-6 text-base text-[var(--ce-on-surface-variant)]">
        <span className="inline-flex items-center gap-3">
          <CalendarDays size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          {formatEventDate(event.startTime, event.endTime)}
        </span>
        <span className="inline-flex items-center gap-3">
          <MapPin size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          Sepolia
        </span>
        <span className="inline-flex items-center gap-3">
          <UserRound size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          {shortenAddress(event.organizer)}
        </span>
      </div>
      <p className="mt-8 max-w-5xl text-lg leading-8">{event.description}</p>
    </Panel>
  );
}

export function EventMetrics({ event }: Readonly<{ event: ChainEventRecord | null }>) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Price"
        value={
          event ? (
            <>
              <span>{formatEther(BigInt(event.ticketPrice))}</span>{" "}
              <span className="ce-label text-[var(--ce-secondary)]">ETH</span>
            </>
          ) : (
            <span>--</span>
          )
        }
        detail={event ? "Read from getEvent" : "Awaiting contract read"}
      />
      <MetricCard
        label="Availability"
        value={
          event ? (
            <>
              <span>{event.sold}</span>{" "}
              <span className="ce-label text-[var(--ce-on-surface-variant)]">/ {event.maxSupply}</span>
            </>
          ) : (
            <span>--</span>
          )
        }
        detail={
          event ? (
            <span className="block h-2 rounded-full bg-[var(--ce-surface-container-high)]">
              <span
                className="block h-2 rounded-full bg-[var(--ce-secondary)]"
                style={{
                  width: `${Math.min(100, (Number(event.sold) / Number(event.maxSupply)) * 100)}%`,
                }}
              />
            </span>
          ) : (
            "Awaiting supply"
          )
        }
      />
      <MetricCard
        label="Protocol"
        value={
          <span className="inline-flex items-center gap-2 text-2xl">
            <ShieldCheck className="text-[var(--ce-secondary)]" size={26} aria-hidden="true" />
            ERC-721
          </span>
        }
        detail="Secure Minting"
      />
    </div>
  );
}

export function OrganizerControls({ event }: Readonly<{ event: ChainEventRecord | null }>) {
  const { address, isConnected } = useAccount();
  const isOrganizer =
    Boolean(event && address) && event?.organizer.toLowerCase() === address?.toLowerCase();

  return (
    <Panel className="bg-[var(--ce-surface-container-low)] p-6">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <ShieldCheck size={24} aria-hidden="true" />
        Organizer Controls
      </h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Panel className="p-5">
          <Field label="Scanner Wallets" placeholder="0x..." />
          <p className="mt-4 text-sm text-[var(--ce-on-surface-variant)]">
            {isOrganizer
              ? "Scanner write controls are ready for the next milestone."
              : "Connect as the organizer wallet to manage scanner permissions."}
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="ce-label uppercase text-[var(--ce-on-surface-variant)]">Danger Zone</p>
          <p className="mt-4 text-sm text-[var(--ce-on-surface-variant)]">
            Deactivation is an organizer transaction and will be wired with contract writes.
          </p>
          <Button tone="danger" className="mt-8 w-full" disabled={!isConnected || !isOrganizer}>
            Deactivate Event
          </Button>
        </Panel>
      </div>
    </Panel>
  );
}

export function PurchasePanel({ event }: Readonly<{ event: ChainEventRecord | null }>) {
  const chainId = useChainId();
  const isSepolia = chainId === sepolia.id;
  const status = event ? getEventStatus(event) : "Unavailable";

  return (
    <aside className="grid content-start gap-6">
      <div className="flex justify-end">
        <Badge tone={status === "Active" ? "success" : status === "Upcoming" ? "info" : "neutral"}>
          {status}
        </Badge>
      </div>
      <Panel emphasis="strong" className="p-7">
        <h2 className="text-2xl font-semibold">Secure Ticket</h2>
        <div className="mt-8 grid gap-5 text-base">
          <div className="flex justify-between border-b border-[var(--ce-outline-variant)] pb-4">
            <span className="text-[var(--ce-on-surface-variant)]">Standard Ticket</span>
            <span className="ce-label">
              {event ? `${formatEther(BigInt(event.ticketPrice))} ETH` : "-- ETH"}
            </span>
          </div>
          <div className="flex justify-between border-b border-[var(--ce-outline-variant)] pb-4">
            <span className="text-[var(--ce-on-surface-variant)]">Estimated Gas</span>
            <span className="ce-label text-[var(--ce-secondary)]">Wallet estimates at signing</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total Cost</span>
            <span>{event ? `${formatEther(BigInt(event.ticketPrice))} ETH + gas` : "Unavailable"}</span>
          </div>
        </div>
        <Button className="mt-8 min-h-14 w-full text-lg" disabled>
          Buy Ticket
        </Button>
        <p className="mt-5 text-center text-sm text-[var(--ce-on-surface-variant)]">
          {isSepolia
            ? "Ticket purchase writes are the next milestone; reads are live."
            : "Switch to Sepolia before ticket purchase writes are enabled."}
        </p>
      </Panel>
      <Panel className="bg-[var(--ce-surface-container-low)] p-6">
        <p className="ce-label uppercase text-[var(--ce-on-surface-variant)]">Contract Information</p>
        <dl className="mt-5 grid gap-5">
          <div>
            <dt className="ce-label-sm text-[var(--ce-on-surface-variant)]">Event Contract</dt>
            <dd className="ce-label mt-1">{shortenAddress(chainEventsAddress)}</dd>
          </div>
          <div>
            <dt className="ce-label-sm text-[var(--ce-on-surface-variant)]">Start Time</dt>
            <dd className="ce-label mt-1">
              {event ? formatEventDateTime(event.startTime) : "Unavailable"}
            </dd>
          </div>
        </dl>
      </Panel>
    </aside>
  );
}

export function EventDetailContent({ eventId }: Readonly<{ eventId: string }>) {
  const { eventId: parsedEventId, event, isLoading, isError } = useEventDetail(eventId);

  return (
    <section className="grid gap-7 xl:grid-cols-[minmax(0,2fr)_minmax(360px,.95fr)]">
      <div className="grid content-start gap-7">
        <EventHero
          event={event}
          isLoading={isLoading}
          isError={isError}
          invalidEventId={parsedEventId === null}
        />
        <EventMetrics event={event} />
        <OrganizerControls event={event} />
      </div>
      <PurchasePanel event={event} />
    </section>
  );
}
