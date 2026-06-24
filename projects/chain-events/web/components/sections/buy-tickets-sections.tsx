"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  RefreshCw,
  Search,
  ShoppingCart,
  Ticket,
  WalletCards,
} from "lucide-react";
import { type Address } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import { TransactionStatus } from "@/components/transaction-status";
import {
  Badge,
  Button,
  EmptyState,
  Panel,
  StatusCallout,
  cx,
} from "@/components/ui/primitives";
import {
  chainEventsAbi,
  chainEventsAddress,
  hasChainEventsAddress,
} from "@/lib/contract";
import {
  type AvailableEventsData,
  type ChainEventRecord,
  formatEthPrice,
  formatEventDate,
  formatEventDateTime,
  getEventStatus,
  shortenAddress,
} from "@/lib/chain-events-format";

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

const emptyEvents: ChainEventRecord[] = [];

function getEventField<T>(eventData: EventData, index: number, key: keyof EventDataObject) {
  return (
    Array.isArray(eventData)
      ? (eventData as EventDataTuple)[index]
      : (eventData as EventDataObject)[key]
  ) as T;
}

function eventFromData(id: string, eventData: EventData): ChainEventRecord {
  return {
    id,
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

export function BuyTicketsContent() {
  const queryClient = useQueryClient();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isSepolia = chainId === sepolia.id;
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const {
    data: hash,
    error: writeError,
    isPending: isSignaturePending,
    writeContract,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash, chainId: sepolia.id });

  const [searchTerm, setSearchTerm] = useState("");
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

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
  const statusError = useMemo(() => {
    if (localError) {
      return new Error(localError);
    }

    return writeError ?? receiptError ?? null;
  }, [localError, receiptError, writeError]);

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["chain-events-available-events"] });
    void queryClient.invalidateQueries({ queryKey: ["chain-events-dashboard", address] });
  }, [address, isSuccess, queryClient]);

  async function handleBuy(event: ChainEventRecord) {
    setLocalError(null);

    if (!hasChainEventsAddress) {
      setLocalError("ChainEvents contract address is not configured.");
      return;
    }

    if (!isConnected || !address) {
      setLocalError("Connect MetaMask before buying a ticket.");
      return;
    }

    if (!isSepolia) {
      setLocalError("Switch to Sepolia before buying a ticket.");
      return;
    }

    if (!publicClient) {
      setLocalError("Sepolia RPC client is not ready.");
      return;
    }

    const eventId = BigInt(event.id);
    setPendingEventId(event.id);

    try {
      const eventData = (await publicClient.readContract({
        address: chainEventsAddress,
        abi: chainEventsAbi,
        functionName: "getEvent",
        args: [eventId],
      })) as EventData;
      const freshEvent = eventFromData(event.id, eventData);
      const blocker = getPurchaseBlocker(freshEvent, serverNowSeconds);

      if (blocker) {
        setLocalError(blocker);
        return;
      }

      const ticketPrice = BigInt(freshEvent.ticketPrice);

      await publicClient.simulateContract({
        account: address,
        address: chainEventsAddress,
        abi: chainEventsAbi,
        functionName: "buyTicket",
        args: [eventId],
        value: ticketPrice,
      });

      writeContract({
        address: chainEventsAddress,
        abi: chainEventsAbi,
        functionName: "buyTicket",
        args: [eventId],
        value: ticketPrice,
        chainId: sepolia.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ticket purchase simulation failed.";
      setLocalError(message);
    } finally {
      setPendingEventId(null);
    }
  }

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

        {isConnected && !isSepolia ? (
          <Button
            tone="secondary"
            disabled={isSwitchPending}
            onClick={() => switchChain({ chainId: sepolia.id })}
            className="min-h-12"
          >
            <AlertTriangle size={17} aria-hidden="true" />
            {isSwitchPending ? "Switching" : "Switch to Sepolia"}
          </Button>
        ) : null}

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
          Showing {filteredEvents.length} of {events.length} buyable events. Buyer pays ticket
          price plus network gas; the event treasury receives the ticket price.
        </p>
      </Panel>

      <TransactionStatus
        hash={hash}
        isConfirming={isSignaturePending || isConfirming}
        isSuccess={isSuccess}
        error={statusError}
      />

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
            const isPending = pendingEventId === event.id || isSignaturePending || isConfirming;

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
                    This event starts {formatEventDateTime(event.startTime)}. You can buy now; the
                    ticket is valid during the event window.
                  </p>
                ) : null}

                <div className="grid gap-3 border-t border-[var(--ce-outline-variant)] pt-5">
                  <Button
                    disabled={Boolean(blocker) || isPending}
                    onClick={() => void handleBuy(event)}
                    className={cx("min-h-12 w-full", isPending && "cursor-wait")}
                  >
                    <ShoppingCart size={17} aria-hidden="true" />
                    {pendingEventId === event.id
                      ? "Simulating"
                      : isSignaturePending
                        ? "Confirm in Wallet"
                        : isConfirming
                          ? "Confirming"
                          : "Buy Ticket"}
                  </Button>
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
