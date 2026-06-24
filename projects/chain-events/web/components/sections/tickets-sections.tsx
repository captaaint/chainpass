"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search, Ticket } from "lucide-react";

import { useChainEventsDashboard } from "@/components/use-chain-events-dashboard";
import {
  formatEventDateTime,
  getTicketStatus,
  shortenAddress,
  type TicketRecord,
} from "@/lib/chain-events-format";
import { chainEventsAddress } from "@/lib/contract";
import { Button, EmptyState, Panel, TicketPreviewCard, cx } from "@/components/ui/primitives";

type TicketFilter = "all" | "valid" | "checked-in";

const filterOptions: Array<{ label: string; value: TicketFilter }> = [
  { label: "All", value: "all" },
  { label: "Valid", value: "valid" },
  { label: "Checked in", value: "checked-in" },
];
const emptyTickets: TicketRecord[] = [];

function getTicketGalleryState({
  isConnected,
  isSepolia,
  isLoading,
  isError,
  configured,
  compatible,
  error,
}: {
  isConnected: boolean;
  isSepolia: boolean;
  isLoading: boolean;
  isError: boolean;
  configured?: boolean;
  compatible?: boolean;
  error?: string;
}) {
  if (!isConnected) {
    return {
      title: "Wallet disconnected",
      detail: "Connect MetaMask to load tickets owned by your wallet.",
    };
  }

  if (!isSepolia) {
    return {
      title: "Wrong network",
      detail: "Switch to Sepolia before reading wallet ticket ownership.",
    };
  }

  if (isLoading) {
    return {
      title: "Loading tickets",
      detail: "Reading purchase logs and confirming current token ownership.",
    };
  }

  if (isError) {
    return {
      title: "Ticket data failed to load",
      detail: "Check the RPC URL, contract address, and server logs.",
    };
  }

  if (configured === false) {
    return {
      title: "Contract not configured",
      detail: "Set the ChainEvents contract address and deployment block to read tickets.",
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
    title: "No tickets found",
    detail: "This wallet does not currently own tickets discovered from ChainEvents purchase logs.",
  };
}

function getFilteredTickets(tickets: TicketRecord[], searchTerm: string, filter: TicketFilter) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return tickets.filter((ticket) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "valid" && getTicketStatus(ticket).usableNow) ||
      (filter === "checked-in" && ticket.used);

    if (!matchesFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      ticket.tokenId,
      ticket.eventId,
      ticket.owner,
      ticket.event.name,
      ticket.event.description,
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
  });
}

function getVariant(ticket: TicketRecord, index: number) {
  if (ticket.used) {
    return "mono" as const;
  }

  return index % 2 === 0 ? "cyan" : "gold";
}

export function TicketGallery() {
  const dashboard = useChainEventsDashboard();
  const tickets = dashboard.data?.tickets ?? emptyTickets;
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<TicketFilter>("all");
  const filteredTickets = useMemo(
    () => getFilteredTickets(tickets, searchTerm, filter),
    [filter, searchTerm, tickets],
  );
  const state = getTicketGalleryState({
    isConnected: dashboard.isConnected,
    isSepolia: dashboard.isSepolia,
    isLoading: dashboard.isLoading,
    isError: dashboard.isError,
    configured: dashboard.data?.configured,
    compatible: dashboard.data?.compatible,
    error: dashboard.data?.error,
  });
  const canUseControls = tickets.length > 0;
  const emptyTitle = tickets.length > 0 ? "No matching tickets" : state.title;
  const emptyDetail =
    tickets.length > 0
      ? "Adjust the search term or status filter to widen the gallery."
      : state.detail;

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
            disabled={!canUseControls}
            placeholder="Search event, token, owner..."
            className="min-h-12 w-full rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-white pl-12 pr-4 text-sm outline-none transition focus:border-[var(--ce-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <div className="grid grid-cols-3 rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface-container-low)] p-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={!canUseControls}
              onClick={() => setFilter(option.value)}
              className={cx(
                "ce-label min-h-10 rounded-[calc(var(--ce-radius)-2px)] px-3 text-[var(--ce-on-surface-variant)] transition disabled:cursor-not-allowed disabled:opacity-60",
                filter === option.value && "bg-white text-[var(--ce-on-surface)] shadow-sm",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button
          tone="secondary"
          disabled={!dashboard.isConnected || !dashboard.isSepolia || dashboard.isFetching}
          onClick={() => void dashboard.refetch()}
          className="min-h-12"
        >
          <RefreshCw
            size={17}
            aria-hidden="true"
            className={dashboard.isFetching ? "animate-spin" : undefined}
          />
          Refresh
        </Button>

        <p className="ce-label text-[var(--ce-on-surface-variant)] md:col-span-3">
          Showing {filteredTickets.length} of {tickets.length} wallet-owned tickets
        </p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket, index) => {
            const status = getTicketStatus(ticket);

            return (
              <TicketPreviewCard
                key={ticket.tokenId}
                title={ticket.event.name}
                subtitle={`${formatEventDateTime(ticket.event.startTime)} · Owner ${shortenAddress(ticket.owner)}`}
                id={ticket.tokenId}
                badge={status.label}
                badgeTone={status.tone}
                variant={getVariant(ticket, index)}
                disabled={ticket.used}
                detailsHref={`/tickets/${ticket.tokenId}`}
                externalHref={`https://sepolia.etherscan.io/token/${chainEventsAddress}?a=${ticket.tokenId}`}
              />
            );
          })
        ) : (
          <Panel className="p-6 lg:col-span-3">
            <div className="mb-4 flex justify-end">
              <Ticket size={22} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
            </div>
            <EmptyState title={emptyTitle} detail={emptyDetail} />
          </Panel>
        )}
      </div>
    </section>
  );
}
