"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { formatEther, isAddress } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import { TransactionStatus } from "@/components/transaction-status";
import { useChainEventsDashboard } from "@/components/use-chain-events-dashboard";
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
  ButtonLink,
  EmptyState,
  MetricCard,
  Panel,
  StatusCallout,
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

function getPurchaseBlocker(event: ChainEventRecord) {
  const status = getEventStatus(event);

  if (!event.active) {
    return "Event is inactive.";
  }

  if (status === "Upcoming") {
    return "Event has not started yet.";
  }

  if (status === "Ended") {
    return "Event has ended.";
  }

  if (BigInt(event.sold) >= BigInt(event.maxSupply)) {
    return "Event is sold out.";
  }

  return null;
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

export function OrganizerControls({
  event,
  refetchEvent,
}: Readonly<{
  event: ChainEventRecord | null;
  refetchEvent: () => void;
}>) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isSepolia = chainId === sepolia.id;
  const [scannerAddress, setScannerAddress] = useState("");
  const [allowScanner, setAllowScanner] = useState(true);
  const [scannerFormError, setScannerFormError] = useState<string | null>(null);
  const [deleteFormError, setDeleteFormError] = useState<string | null>(null);
  const {
    data: scannerHash,
    error: scannerWriteError,
    isPending: isScannerSignaturePending,
    writeContract: writeScanner,
  } = useWriteContract();
  const {
    isLoading: isScannerConfirming,
    isSuccess: isScannerSuccess,
    error: scannerReceiptError,
  } = useWaitForTransactionReceipt({ hash: scannerHash, chainId: sepolia.id });
  const {
    data: deleteHash,
    error: deleteWriteError,
    isPending: isDeleteSignaturePending,
    writeContract: writeDelete,
  } = useWriteContract();
  const {
    isLoading: isDeleteConfirming,
    isSuccess: isDeleteSuccess,
    error: deleteReceiptError,
  } = useWaitForTransactionReceipt({ hash: deleteHash, chainId: sepolia.id });
  const isOrganizer =
    Boolean(event && address) && event?.organizer.toLowerCase() === address?.toLowerCase();
  const scannerError = useMemo(() => {
    if (scannerFormError) {
      return new Error(scannerFormError);
    }

    return scannerWriteError ?? scannerReceiptError ?? null;
  }, [scannerFormError, scannerReceiptError, scannerWriteError]);
  const deleteError = useMemo(() => {
    if (deleteFormError) {
      return new Error(deleteFormError);
    }

    return deleteWriteError ?? deleteReceiptError ?? null;
  }, [deleteFormError, deleteReceiptError, deleteWriteError]);

  useEffect(() => {
    if (!isDeleteSuccess) {
      return;
    }

    refetchEvent();
  }, [isDeleteSuccess, refetchEvent]);

  function handleScannerUpdate() {
    setScannerFormError(null);

    if (!event) {
      setScannerFormError("Event details are not loaded.");
      return;
    }

    if (!isConnected || !isOrganizer) {
      setScannerFormError("Connect as the event organizer to manage scanners.");
      return;
    }

    if (!isSepolia) {
      setScannerFormError("Switch to Sepolia before updating scanner permissions.");
      return;
    }

    if (!isAddress(scannerAddress.trim())) {
      setScannerFormError("Enter a valid scanner wallet address.");
      return;
    }

    writeScanner({
      address: chainEventsAddress,
      abi: chainEventsAbi,
      functionName: "setScanner",
      args: [BigInt(event.id), scannerAddress.trim() as `0x${string}`, allowScanner],
      chainId: sepolia.id,
    });
  }

  function handleDeleteEvent() {
    setDeleteFormError(null);

    if (!event) {
      setDeleteFormError("Event details are not loaded.");
      return;
    }

    if (!isConnected || !isOrganizer) {
      setDeleteFormError("Connect as the event organizer to deactivate this event.");
      return;
    }

    if (!isSepolia) {
      setDeleteFormError("Switch to Sepolia before deactivating this event.");
      return;
    }

    writeDelete({
      address: chainEventsAddress,
      abi: chainEventsAbi,
      functionName: "deleteEvent",
      args: [BigInt(event.id)],
      chainId: sepolia.id,
    });
  }

  if (!isOrganizer) {
    return null;
  }

  return (
    <Panel className="bg-[var(--ce-surface-container-low)] p-6">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <ShieldCheck size={24} aria-hidden="true" />
        Organizer Controls
      </h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Panel className="p-5">
          <label className="grid gap-2">
            <span className="ce-label text-[var(--ce-on-surface-variant)]">Scanner Wallet</span>
            <input
              value={scannerAddress}
              onChange={(scannerEvent) => setScannerAddress(scannerEvent.target.value)}
              placeholder="0x..."
              className="min-h-11 rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface)] px-4 text-sm text-[var(--ce-on-surface)] outline-none transition placeholder:text-[#7a8290] focus:border-[var(--ce-secondary)]"
            />
          </label>
          <label className="ce-label mt-4 flex items-center gap-3 text-[var(--ce-on-surface-variant)]">
            <input
              type="checkbox"
              checked={allowScanner}
              onChange={(scannerEvent) => setAllowScanner(scannerEvent.target.checked)}
              className="size-4"
            />
            Allow this wallet to scan tickets
          </label>
          <Button
            className="mt-5 w-full"
            disabled={!isConnected || !isOrganizer || isScannerSignaturePending || isScannerConfirming}
            onClick={handleScannerUpdate}
          >
            {isScannerSignaturePending
              ? "Confirm in Wallet"
              : isScannerConfirming
                ? "Updating Scanner"
                : "Update Scanner"}
          </Button>
          <p className="mt-4 text-sm text-[var(--ce-on-surface-variant)]">
            {isOrganizer
              ? "Organizer wallets can grant or revoke scanner permissions for this event."
              : "Connect as the organizer wallet to manage scanner permissions."}
          </p>
          <div className="mt-4">
            <TransactionStatus
              hash={scannerHash}
              isConfirming={isScannerSignaturePending || isScannerConfirming}
              isSuccess={isScannerSuccess}
              error={scannerError}
            />
          </div>
        </Panel>
        <Panel className="p-5">
          <p className="ce-label uppercase text-[var(--ce-on-surface-variant)]">Danger Zone</p>
          <p className="mt-4 text-sm text-[var(--ce-on-surface-variant)]">
            Deactivation marks the event inactive. Purchases, scanner updates, and check-in will
            be blocked by the contract.
          </p>
          <Button
            tone="danger"
            className="mt-8 w-full"
            disabled={!isConnected || !isOrganizer || isDeleteSignaturePending || isDeleteConfirming}
            onClick={handleDeleteEvent}
          >
            {isDeleteSignaturePending
              ? "Confirm in Wallet"
              : isDeleteConfirming
                ? "Deactivating"
                : "Deactivate Event"}
          </Button>
          <div className="mt-4">
            <TransactionStatus
              hash={deleteHash}
              isConfirming={isDeleteSignaturePending || isDeleteConfirming}
              isSuccess={isDeleteSuccess}
              error={deleteError}
            />
          </div>
        </Panel>
      </div>
    </Panel>
  );
}

export function PurchasePanel({
  event,
  refetchEvent,
}: Readonly<{
  event: ChainEventRecord | null;
  refetchEvent: () => void;
}>) {
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { address, isConnected } = useAccount();
  const dashboard = useChainEventsDashboard();
  const chainId = useChainId();
  const isSepolia = chainId === sepolia.id;
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const {
    data: buyHash,
    error: buyWriteError,
    isPending: isBuySignaturePending,
    writeContract: writeBuy,
  } = useWriteContract();
  const {
    isLoading: isBuyConfirming,
    isSuccess: isBuySuccess,
    error: buyReceiptError,
  } = useWaitForTransactionReceipt({ hash: buyHash, chainId: sepolia.id });
  const [buyFormError, setBuyFormError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const status = event ? getEventStatus(event) : "Unavailable";
  const purchaseBlocker = event ? getPurchaseBlocker(event) : "Event details are not loaded.";
  const isOrganizer =
    Boolean(event && address) && event?.organizer.toLowerCase() === address?.toLowerCase();
  const ownedTicket = event
    ? dashboard.data?.tickets.find((ticket) => ticket.eventId === event.id)
    : undefined;
  const buyError = useMemo(() => {
    if (buyFormError) {
      return new Error(buyFormError);
    }

    return buyWriteError ?? buyReceiptError ?? null;
  }, [buyFormError, buyReceiptError, buyWriteError]);

  useEffect(() => {
    if (!isBuySuccess) {
      return;
    }

    refetchEvent();
  }, [isBuySuccess, refetchEvent]);

  async function handleBuyTicket() {
    setBuyFormError(null);

    if (!event) {
      setBuyFormError("Event details are not loaded.");
      return;
    }

    if (!isConnected || !address) {
      setBuyFormError("Connect MetaMask before buying a ticket.");
      return;
    }

    if (!isSepolia) {
      setBuyFormError("Switch to Sepolia before buying a ticket.");
      return;
    }

    if (!publicClient) {
      setBuyFormError("Sepolia RPC client is not ready.");
      return;
    }

    setIsSimulating(true);

    try {
      const eventId = BigInt(event.id);
      const eventData = (await publicClient.readContract({
        address: chainEventsAddress,
        abi: chainEventsAbi,
        functionName: "getEvent",
        args: [eventId],
      })) as EventData;
      const freshEvent = eventFromTuple(eventId, eventData);
      const blocker = getPurchaseBlocker(freshEvent);

      if (blocker) {
        setBuyFormError(blocker);
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

      writeBuy({
        address: chainEventsAddress,
        abi: chainEventsAbi,
        functionName: "buyTicket",
        args: [eventId],
        value: ticketPrice,
        chainId: sepolia.id,
      });
    } catch (error) {
      setBuyFormError(error instanceof Error ? error.message : "Ticket purchase simulation failed.");
    } finally {
      setIsSimulating(false);
    }
  }

  return (
    <aside className="grid content-start gap-6">
      <div className="flex justify-end">
        <Badge tone={status === "Active" ? "success" : status === "Upcoming" ? "info" : "neutral"}>
          {status}
        </Badge>
      </div>
      {!isOrganizer ? (
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
          {isConnected && !isSepolia ? (
            <Button
              tone="secondary"
              className="mt-8 min-h-12 w-full"
              disabled={isSwitchPending}
              onClick={() => switchChain({ chainId: sepolia.id })}
            >
              {isSwitchPending ? "Switching" : "Switch to Sepolia"}
            </Button>
          ) : null}
          <Button
            className="mt-8 min-h-14 w-full text-lg"
            disabled={Boolean(purchaseBlocker) || isBuySignaturePending || isBuyConfirming || isSimulating}
            onClick={handleBuyTicket}
          >
            <ShoppingCart size={20} aria-hidden="true" />
            {isSimulating
              ? "Simulating"
              : isBuySignaturePending
                ? "Confirm in Wallet"
                : isBuyConfirming
                  ? "Confirming"
                  : "Buy Ticket"}
          </Button>
          <p className="mt-5 text-center text-sm text-[var(--ce-on-surface-variant)]">
            Buyer pays ticket price plus gas. The ticket price is sent to the event treasury.
          </p>
          {ownedTicket ? (
            <StatusCallout title="Ticket already owned" tone="success">
              You already own ticket #{ownedTicket.tokenId} for this event. If the event has not
              started yet, your ticket will become valid during the event window.
              <ButtonLink
                href={`/tickets/${ownedTicket.tokenId}`}
                tone="secondary"
                className="mt-4 w-full"
              >
                View My Ticket
              </ButtonLink>
            </StatusCallout>
          ) : purchaseBlocker ? (
            <StatusCallout title="Purchase unavailable" tone="warning">
              {purchaseBlocker}
            </StatusCallout>
          ) : null}
          <div className="mt-5">
            <TransactionStatus
              hash={buyHash}
              isConfirming={isBuySignaturePending || isBuyConfirming || isSimulating}
              isSuccess={isBuySuccess}
              error={buyError}
            />
          </div>
        </Panel>
      ) : null}
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
  const {
    eventId: parsedEventId,
    event,
    isLoading,
    isError,
    refetch,
  } = useEventDetail(eventId);
  const refetchEvent = useCallback(() => {
    void refetch();
  }, [refetch]);

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
        <OrganizerControls event={event} refetchEvent={refetchEvent} />
      </div>
      <PurchasePanel event={event} refetchEvent={refetchEvent} />
    </section>
  );
}
