"use client";

import Link from "next/link";
import { CalendarPlus, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { PageHeader } from "@/components/page-header";
import { chainInviteNftAbi, chainInviteNftAddress, chainInviteNftDeploymentBlock } from "@/lib/contract-nft";
import { formatTimestamp, normalizeAddress, shortenAddress } from "@/lib/format";

type CreatedEvent = {
  eventId: bigint;
  organizer: Address;
  name: string;
  startTime: bigint;
};

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<CreatedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      if (!publicClient || !address) {
        setEvents([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const logs = await publicClient.getContractEvents({
          address: chainInviteNftAddress,
          abi: chainInviteNftAbi,
          eventName: "EventCreated",
          fromBlock: chainInviteNftDeploymentBlock,
          toBlock: "latest",
          strict: true,
        });

        if (cancelled) {
          return;
        }

        const organizer = normalizeAddress(address);
        const createdEvents = logs
          .map((log) => ({
            eventId: log.args.eventId,
            organizer: log.args.organizer,
            name: log.args.name,
            startTime: log.args.startTime,
          }))
          .filter((event) => normalizeAddress(event.organizer) === organizer)
          .sort((a, b) => Number(b.eventId - a.eventId));

        setEvents(createdEvents);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Failed to load events");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [address, publicClient]);

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
              EventCreated logs are filtered by organizer address.
            </p>
          </div>
          <Link
            href="/nft/admin/events/new"
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
            {error}
          </div>
        ) : null}

        {!isLoading && events.length === 0 ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5 text-sm text-[#5c6763]">
            {emptyState}
          </div>
        ) : null}

        <section className="grid gap-3">
          {events.map((event) => (
            <Link
              key={event.eventId.toString()}
              href={`/nft/admin/events/${event.eventId.toString()}`}
              className="grid gap-3 rounded-md border border-[#d8d2c6] bg-white p-5 transition hover:border-[#9d8f7e] md:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f6f52]">
                  Event #{event.eventId.toString()}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{event.name}</h2>
                <p className="mt-2 text-sm text-[#5c6763]">
                  Starts {formatTimestamp(event.startTime)}
                </p>
              </div>
              <span className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#1d6f68]">
                Open
                <ExternalLink size={16} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
