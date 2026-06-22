"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarPlus,
  ExternalLink,
  Inbox,
  Loader2,
  RefreshCw,
  ScanLine,
  Ticket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

import { PageHeader } from "@/components/page-header";
import { formatTimestamp, shortenAddress } from "@/lib/format";

type WalletEventVariant = "base" | "nft";

type WalletEventSummary = {
  variant: WalletEventVariant;
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

type WalletEventsResponse = {
  organized: WalletEventSummary[];
  invited: WalletEventSummary[];
  scannable: WalletEventSummary[];
  error?: string;
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const [organizedEvents, setOrganizedEvents] = useState<WalletEventSummary[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<WalletEventSummary[]>([]);
  const [scannableEvents, setScannableEvents] = useState<WalletEventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isSepolia = chainId === sepolia.id;

  useEffect(() => {
    let cancelled = false;

    async function loadWalletEvents() {
      if (!address) {
        setOrganizedEvents([]);
        setInvitedEvents([]);
        setScannableEvents([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/wallet/${address}/events`, { cache: "no-store" });
        const body = (await response.json()) as WalletEventsResponse;

        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load wallet events.");
        }

        if (!cancelled) {
          setOrganizedEvents(body.organized);
          setInvitedEvents(body.invited);
          setScannableEvents(body.scannable);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Failed to load wallet events.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadWalletEvents();

    return () => {
      cancelled = true;
    };
  }, [address, refreshKey]);

  const status = useMemo(() => {
    if (!isConnected) {
      return {
        title: "Connect your wallet",
        detail: "Your organized events and invitations are shown after wallet connection.",
      };
    }

    if (!isSepolia) {
      return {
        title: "Wrong network",
        detail: "Switch to Sepolia to use the deployed contracts.",
      };
    }

    return {
      title: "Wallet ready",
      detail: `Showing events for ${shortenAddress(address)}.`,
    };
  }, [address, isConnected, isSepolia]);

  return (
    <main className="min-h-screen px-4 py-6 text-[#1d2527] md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <PageHeader eyebrow="ChainInvite" title="My events">
          <p className="mt-2 text-sm text-[#5c6763]">
            See events you organize and events where your wallet is invited.
          </p>
        </PageHeader>

        <section className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5">
            <p className="text-sm font-semibold text-[#5f6f52]">Wallet status</p>
            <h2 className="mt-2 text-xl font-semibold">{status.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#5c6763]">{status.detail}</p>
            {isConnected && !isSepolia ? (
              <button
                type="button"
                disabled={isSwitchPending}
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-[#b6652b] px-4 text-sm font-semibold text-white transition hover:bg-[#8f4d1f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={17} aria-hidden="true" />
                {isSwitchPending ? "Switching" : "Switch to Sepolia"}
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-start gap-2 rounded-md border border-[#d8d2c6] bg-white p-5">
            <Link
              href="/admin/events/new"
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#1d6f68] px-4 text-sm font-semibold text-white transition hover:bg-[#15534e]"
            >
              <CalendarPlus size={17} aria-hidden="true" />
              New standard event
            </Link>
            <Link
              href="/nft/admin/events/new"
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-4 text-sm font-semibold transition hover:border-[#9d8f7e]"
            >
              <Ticket size={17} aria-hidden="true" />
              New NFT event
            </Link>
            <button
              type="button"
              disabled={!address || isLoading}
              onClick={() => setRefreshKey((current) => current + 1)}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-4 text-sm font-semibold transition hover:border-[#9d8f7e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={17} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5 text-sm text-[#5c6763]">
            <p className="flex items-center gap-2">
              <Loader2 size={16} aria-hidden="true" className="animate-spin" />
              Loading wallet events
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5 text-sm leading-6 text-[#a53e2f]">
            <p className="flex items-center gap-2">
              <AlertTriangle size={16} aria-hidden="true" />
              {error}
            </p>
          </div>
        ) : null}

        {!isConnected ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5 text-sm text-[#5c6763]">
            Connect a wallet to load your organized events and invitations.
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-3">
          <EventList
            title="Events I organize"
            emptyText="No events created by this wallet yet."
            events={organizedEvents}
            actionLabel="Manage"
            actionHref={(event) => event.href}
          />
          <EventList
            title="Events I am invited to"
            emptyText="No invitations found for this wallet yet."
            events={invitedEvents}
            actionLabel="Open invite"
            actionHref={(event) => event.inviteHref}
          />
          <EventList
            title="Events I can scan"
            emptyText="No scanner access found for this wallet yet."
            events={scannableEvents}
            actionLabel="Scan"
            actionHref={(event) => event.scannerHref}
            actionIcon="scan"
          />
        </section>
      </div>
    </main>
  );
}

function EventList({
  title,
  emptyText,
  events,
  actionLabel,
  actionHref,
  actionIcon = "open",
}: {
  title: string;
  emptyText: string;
  events: WalletEventSummary[];
  actionLabel: string;
  actionHref: (event: WalletEventSummary) => string;
  actionIcon?: "open" | "scan";
}) {
  return (
    <section className="rounded-md border border-[#d8d2c6] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#5f6f52]">{title}</p>
        <span className="rounded-md bg-[#f6f4ee] px-3 py-2 text-sm font-semibold">
          {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="mt-5 flex items-center gap-2 text-sm text-[#5c6763]">
          <Inbox size={16} aria-hidden="true" />
          {emptyText}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {events.map((event) => (
          <EventCard
            key={`${event.variant}-${event.eventId}-${event.role}`}
            event={event}
            actionLabel={actionLabel}
            actionHref={actionHref(event)}
            actionIcon={actionIcon}
          />
        ))}
      </div>
    </section>
  );
}

function EventCard({
  event,
  actionLabel,
  actionHref,
  actionIcon,
}: {
  event: WalletEventSummary;
  actionLabel: string;
  actionHref: string;
  actionIcon: "open" | "scan";
}) {
  return (
    <div className="grid gap-3 rounded-md border border-[#e5ded3] p-4 transition hover:border-[#9d8f7e]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#e9f5ee] px-2 py-1 text-xs font-semibold text-[#1d7b4f]">
              {event.variant === "nft" ? "NFT" : "Standard"}
            </span>
            <span className="rounded-md bg-[#f6f4ee] px-2 py-1 text-xs font-semibold text-[#5c6763]">
              Event #{event.eventId}
            </span>
            {event.checkedIn ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#e9f5ee] px-2 py-1 text-xs font-semibold text-[#1d7b4f]">
                <BadgeCheck size={13} aria-hidden="true" />
                Checked in
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-lg font-semibold">{event.name}</h2>
          <p className="mt-2 text-sm leading-6 text-[#5c6763]">{event.description}</p>
        </div>
        <Link
          href={actionHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
        >
          {actionLabel}
          {actionIcon === "scan" ? (
            <ScanLine size={16} aria-hidden="true" />
          ) : (
            <ExternalLink size={16} aria-hidden="true" />
          )}
        </Link>
      </div>

      <dl className="grid gap-2 text-sm md:grid-cols-2">
        <div>
          <dt className="font-semibold">Starts</dt>
          <dd className="mt-1 text-[#5c6763]">{formatTimestamp(BigInt(event.startTime))}</dd>
        </div>
        {event.endTime && event.endTime !== "0" ? (
          <div>
            <dt className="font-semibold">Ends</dt>
            <dd className="mt-1 text-[#5c6763]">{formatTimestamp(BigInt(event.endTime))}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold">Organizer</dt>
          <dd className="mt-1 break-all font-mono text-xs text-[#5c6763]">
            {event.organizer}
          </dd>
        </div>
        {event.tokenId ? (
          <div>
            <dt className="font-semibold">Token</dt>
            <dd className="mt-1 text-[#5c6763]">#{event.tokenId}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
