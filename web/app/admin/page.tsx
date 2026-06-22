"use client";

import Link from "next/link";
import { CalendarPlus, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import { PageHeader } from "@/components/page-header";
import { TransactionStatus } from "@/components/transaction-status";
import { chainInviteAbi, chainInviteAddress } from "@/lib/contract";
import { formatTimestamp, normalizeAddress, shortenAddress } from "@/lib/format";

type CreatedEvent = {
  eventId: bigint;
  organizer: Address;
  name: string;
  startTime: bigint;
  active: boolean;
};

type EventData = {
  organizer: Address;
  name: string;
  startTime: bigint;
  active: boolean;
};

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const {
    data: deleteHash,
    error: deleteError,
    isPending: isDeletePending,
    writeContract: writeDelete,
  } = useWriteContract();
  const {
    isLoading: isDeleteConfirming,
    isSuccess: isDeleteSuccess,
  } = useWaitForTransactionReceipt({ hash: deleteHash, chainId: sepolia.id });

  const {
    data: eventCounter,
    error: counterError,
    isLoading: isCounterLoading,
  } = useReadContract({
    address: chainInviteAddress,
    abi: chainInviteAbi,
    functionName: "eventCounter",
    chainId: sepolia.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const eventContracts = useMemo(
    () =>
      Array.from({ length: Number(eventCounter ?? 0n) }, (_, index) => ({
        address: chainInviteAddress,
        abi: chainInviteAbi,
        functionName: "getEvent",
        args: [BigInt(index + 1)] as const,
        chainId: sepolia.id,
      })),
    [eventCounter],
  );

  const {
    data: eventResults,
    error: eventsError,
    isLoading: isEventsLoading,
    refetch: refetchEvents,
  } = useReadContracts({
    contracts: eventContracts,
    query: {
      enabled: Boolean(address) && eventContracts.length > 0,
    },
  });

  const events = useMemo(() => {
    if (!address || !eventResults) {
      return [];
    }

    const organizer = normalizeAddress(address);

    return eventResults
      .map((result, index) => {
        if (result.status !== "success") {
          return null;
        }

        const eventData = result.result as unknown as EventData;
        return {
          eventId: BigInt(index + 1),
          organizer: eventData.organizer,
          name: eventData.name,
          startTime: eventData.startTime,
          active: eventData.active,
        };
      })
      .filter((event): event is CreatedEvent => Boolean(event))
      .filter((event) => event.active && normalizeAddress(event.organizer) === organizer)
      .sort((a, b) => Number(b.eventId - a.eventId));
  }, [address, eventResults]);

  useEffect(() => {
    if (isDeleteSuccess) {
      void refetchEvents();
    }
  }, [isDeleteSuccess, refetchEvents]);

  const isLoading = Boolean(address) && (isCounterLoading || isEventsLoading);
  const error = counterError ?? eventsError;

  function deleteEvent(eventId: bigint) {
    writeDelete({
      address: chainInviteAddress,
      abi: chainInviteAbi,
      functionName: "deleteEvent",
      args: [eventId],
      chainId: sepolia.id,
    });
  }

  const emptyState = useMemo(() => {
    if (!isConnected) {
      return "Connect your organizer wallet to see your events.";
    }

    return "No events created from this wallet yet.";
  }, [isConnected]);

  return (
    <main className="min-h-screen px-4 py-6 text-[#1d2527] md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <PageHeader eyebrow="Admin" title="Organizer dashboard">
          <p className="mt-2 text-sm text-[#5c6763]">
            Manage events created by {address ? shortenAddress(address) : "your wallet"}.
          </p>
        </PageHeader>

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#5f6f52]">Events</p>
            <p className="mt-1 text-sm text-[#5c6763]">
              Contract state is filtered by organizer address.
            </p>
          </div>
          <Link
            href="/admin/events/new"
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#1d6f68] px-4 text-sm font-semibold text-white transition hover:bg-[#15534e]"
          >
            <CalendarPlus size={17} aria-hidden="true" />
            New event
          </Link>
        </section>

        {isLoading ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5 text-sm text-[#5c6763]">
            <p className="flex items-center gap-2">
              <Loader2 size={16} aria-hidden="true" className="animate-spin" />
              Loading events
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5 text-sm leading-6 text-[#a53e2f]">
            {error.message}
          </div>
        ) : null}

        <TransactionStatus
          hash={deleteHash}
          isConfirming={isDeleteConfirming}
          isSuccess={isDeleteSuccess}
          error={deleteError}
        />

        {!isLoading && events.length === 0 ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5 text-sm text-[#5c6763]">
            {emptyState}
          </div>
        ) : null}

        <section className="grid gap-3">
          {events.map((event) => (
            <div
              key={event.eventId.toString()}
              className="grid gap-3 rounded-md border border-[#d8d2c6] bg-white p-5 transition hover:border-[#9d8f7e] md:grid-cols-[1fr_auto]"
            >
              <Link href={`/admin/events/${event.eventId.toString()}`} className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f6f52]">
                  Event #{event.eventId.toString()}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{event.name}</h2>
                <p className="mt-2 text-sm text-[#5c6763]">
                  Starts {formatTimestamp(event.startTime)}
                </p>
              </Link>
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <Link
                  href={`/admin/events/${event.eventId.toString()}`}
                  className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#1d6f68]"
                >
                  Open
                  <ExternalLink size={16} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  disabled={isDeletePending || isDeleteConfirming}
                  onClick={() => deleteEvent(event.eventId)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#d8b8b1] bg-white px-3 text-sm font-semibold text-[#a53e2f] transition hover:border-[#a53e2f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
