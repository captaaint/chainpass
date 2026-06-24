"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  RefreshCw,
  Search,
  ShoppingCart,
  Ticket,
  WalletCards,
} from "lucide-react";

import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Panel,
  StatusCallout,
} from "@/components/ui/primitives";
import {
  type AvailableEventsData,
  type ChainEventRecord,
  formatEthPrice,
  formatEventDate,
  formatEventDateTime,
  getEventStatus,
  shortenAddress,
} from "@/lib/chain-events-format";

const emptyEvents: ChainEventRecord[] = [];

function isSoldOut(event: ChainEventRecord) {
  return BigInt(event.sold) >= BigInt(event.maxSupply);
}

function getPurchaseBlocker(event: ChainEventRecord, nowSeconds: number) {
  const now = BigInt(nowSeconds);

  if (!event.active) {
    return "Event is inactive.";
  }

  if (now > BigInt(event.endTime)) {
    return "Event has ended.";
  }

  if (isSoldOut(event)) {
    return "Event is sold out.";
  }

  return null;
}

function getFilteredEvents(events: ChainEventRecord[], searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return events;
  }

  return events.filter((event) =>
    [event.id, event.name, event.description, event.organizer, event.treasury].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    ),
  );
}

function getListState({
  isLoading,
  isError,
  configured,
  compatible,
  error,
}: {
  isLoading: boolean;
  isError: boolean;
  configured?: boolean;
  compatible?: boolean;
  error?: string;
}) {
  if (isLoading) {
    return {
      title: "Loading available tickets",
      detail: "Reading ChainEvents logs and current event supply from Sepolia.",
    };
  }

  if (isError) {
    return {
      title: "Ticket listing failed to load",
      detail: "Check the server RPC URL, contract address, and API logs.",
    };
  }

  if (configured === false) {
    return {
      title: "Contract not configured",
      detail: "Set NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS and the deployment block to list tickets.",
    };
  }

  if (compatible === false) {
    return {
      title: "Contract ABI mismatch",
      detail:
        error ??
        "The configured address does not match the current ChainEvents contract. Check .env.local.",
    };
  }

  return {
    title: "No tickets available",
    detail: "No active, unsold ChainEvents tickets were found from indexed event logs.",
  };
}

export function EventsListingContent() {
  const [searchTerm, setSearchTerm] = useState("");

  const eventsQuery = useQuery({
    queryKey: ["chain-events-available-events"],
    queryFn: async () => {
      const response = await fetch("/api/chain-events/events", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return (await response.json()) as AvailableEventsData;
    },
    refetchOnWindowFocus: false,
  });
  const events = eventsQuery.data?.events ?? emptyEvents;
  const serverNowSeconds = Number(eventsQuery.data?.serverTime ?? "0");
  const filteredEvents = useMemo(
    () => getFilteredEvents(events, searchTerm),
    [events, searchTerm],
  );
  const listState = getListState({
    isLoading: eventsQuery.isLoading,
    isError: eventsQuery.isError,
    configured: eventsQuery.data?.configured,
    compatible: eventsQuery.data?.compatible,
    error: eventsQuery.data?.error,
  });

  return (
    <section className="grid gap-6">
      <Panel className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
        <label className="relative min-w-0">
          <Search
            size={20}
            aria-hidden="true"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ce-on-surface-variant)]"
          />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            disabled={events.length === 0}
            placeholder="Search event, organizer, treasury..."
            className="min-h-12 w-full rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-white pl-12 pr-4 text-sm outline-none transition focus:border-[var(--ce-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <Button
          tone="secondary"
          disabled={eventsQuery.isFetching}
          onClick={() => void eventsQuery.refetch()}
          className="min-h-12"
        >
          <RefreshCw
            size={17}
            aria-hidden="true"
            className={eventsQuery.isFetching ? "animate-spin" : undefined}
          />
          Refresh
        </Button>

        <p className="ce-label text-[var(--ce-on-surface-variant)] md:col-span-3">
          Showing {filteredEvents.length} of {events.length} available events. Open an event to
          review details and buy a ticket.
        </p>
      </Panel>

      {eventsQuery.data?.compatible === false ? (
        <StatusCallout title="Contract ABI mismatch" tone="danger">
          {eventsQuery.data.error}
        </StatusCallout>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const status = getEventStatus(event);
            const remaining = BigInt(event.maxSupply) - BigInt(event.sold);
            const startsInFuture =
              serverNowSeconds > 0 && BigInt(event.startTime) > BigInt(serverNowSeconds);
            const blocker =
              serverNowSeconds > 0 ? getPurchaseBlocker(event, serverNowSeconds) : null;

            return (
              <Panel key={event.id} className="grid content-between gap-6 p-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <Badge tone={status === "Active" ? "success" : "info"}>{status}</Badge>
                    <Ticket size={24} aria-hidden="true" className="text-[var(--ce-secondary)]" />
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold leading-8">{event.name}</h2>
                  <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-[var(--ce-on-surface-variant)]">
                    {event.description}
                  </p>
                </div>

                <dl className="grid gap-4 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-[var(--ce-outline-variant)] pb-3">
                    <dt className="inline-flex items-center gap-2 text-[var(--ce-on-surface-variant)]">
                      <WalletCards size={16} aria-hidden="true" />
                      Price
                    </dt>
                    <dd className="ce-label text-[var(--ce-on-surface)]">
                      {formatEthPrice(event.ticketPrice)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-[var(--ce-outline-variant)] pb-3">
                    <dt className="inline-flex items-center gap-2 text-[var(--ce-on-surface-variant)]">
                      <CalendarDays size={16} aria-hidden="true" />
                      Window
                    </dt>
                    <dd className="ce-label text-right text-[var(--ce-on-surface)]">
                      {formatEventDate(event.startTime, event.endTime)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--ce-on-surface-variant)]">Remaining</dt>
                    <dd className="ce-label text-[var(--ce-on-surface)]">
                      {remaining.toString()} / {event.maxSupply}
                    </dd>
                  </div>
                </dl>

                {startsInFuture ? (
                  <p className="rounded-[var(--ce-radius)] bg-[var(--ce-info-container)] px-4 py-3 text-sm leading-6 text-[var(--ce-info)]">
                    This event starts {formatEventDateTime(event.startTime)}. Ticket purchase is
                    available from the event details page.
                  </p>
                ) : null}

                <div className="grid gap-3 border-t border-[var(--ce-outline-variant)] pt-5">
                  <ButtonLink href={`/events/${event.id}`} className="min-h-12 w-full">
                    <ShoppingCart size={17} aria-hidden="true" />
                    View Event
                  </ButtonLink>
                  <p className="ce-label text-center text-[var(--ce-on-surface-variant)]">
                    Treasury: {shortenAddress(event.treasury)}
                  </p>
                  {blocker ? (
                    <p className="ce-label text-center text-[var(--ce-error)]">{blocker}</p>
                  ) : null}
                </div>
              </Panel>
            );
          })
        ) : (
          <Panel className="p-6 xl:col-span-3">
            <div className="mb-4 flex justify-end">
              <Ticket size={22} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
            </div>
            <EmptyState
              title={events.length > 0 ? "No matching events" : listState.title}
              detail={
                events.length > 0
                  ? "Adjust the search term to find a buyable event."
                  : listState.detail
              }
            />
          </Panel>
        )}
      </div>
    </section>
  );
}
