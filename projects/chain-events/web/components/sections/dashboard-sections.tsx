"use client";

import Link from "next/link";
import { Box, Lock, MoreVertical, ScanLine, Ticket } from "lucide-react";

import { useChainEventsDashboard } from "@/components/use-chain-events-dashboard";
import {
  formatEthPrice,
  formatEventDate,
  getEventStatus,
  shortenAddress,
} from "@/lib/chain-events-format";
import { Badge, EmptyState, Panel } from "@/components/ui/primitives";

function getWalletDataState({
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
      detail: "Connect MetaMask to load wallet-specific ChainEvents data.",
    };
  }

  if (!isSepolia) {
    return {
      title: "Wrong network",
      detail: "Switch to Sepolia to read ChainEvents contract and indexer data.",
    };
  }

  if (isLoading) {
    return {
      title: "Loading contract data",
      detail: "Reading ChainEvents logs and confirming current on-chain state.",
    };
  }

  if (isError) {
    return {
      title: "Contract data failed to load",
      detail: "Check the RPC URL, contract address, and browser/server console for the indexer error.",
    };
  }

  if (configured === false) {
    return {
      title: "Contract not configured",
      detail: "Set NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS and the deployment block to read ChainEvents data.",
    };
  }

  if (compatible === false) {
    return {
      title: "Contract ABI mismatch",
      detail:
        error ??
        "The configured address does not match the current ChainEvents contract. Check the deployment address in .env.local.",
    };
  }

  return {
    title: "No records for this wallet",
    detail: "No matching ChainEvents logs were found for the connected wallet.",
  };
}

export function EventsTable() {
  const dashboard = useChainEventsDashboard();
  const events = dashboard.data?.organizedEvents ?? [];
  const state = getWalletDataState({
    isConnected: dashboard.isConnected,
    isSepolia: dashboard.isSepolia,
    isLoading: dashboard.isLoading,
    isError: dashboard.isError,
    configured: dashboard.data?.configured,
    compatible: dashboard.data?.compatible,
    error: dashboard.data?.error,
  });

  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-[1.4fr_.7fr_.45fr_.55fr_.55fr_32px] gap-4 border-b border-[var(--ce-outline-variant)] bg-[var(--ce-surface-container-low)] px-6 py-4">
        {["Event Name", "Date", "Price", "Supply", "Status", ""].map((header) => (
          <span key={header} className="ce-label uppercase text-[var(--ce-on-surface-variant)]">
            {header}
          </span>
        ))}
      </div>
      {events.length > 0 ? (
        <div className="divide-y divide-[var(--ce-outline-variant)]">
          {events.map((event, index) => {
            const status = getEventStatus(event);
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="grid grid-cols-[1.4fr_.7fr_.45fr_.55fr_.55fr_32px] items-center gap-4 px-6 py-5 transition hover:bg-[var(--ce-surface-container-low)]"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--ce-radius)] bg-[var(--ce-info-container)] text-[var(--ce-info)]">
                    {index === 0 ? (
                      <Box size={22} aria-hidden="true" />
                    ) : (
                      <Ticket size={22} aria-hidden="true" />
                    )}
                  </span>
                  <span className="truncate text-xl font-semibold">{event.name}</span>
                </span>
                <span className="text-sm text-[var(--ce-on-surface-variant)]">
                  {formatEventDate(event.startTime, event.endTime)}
                </span>
                <span className="ce-label">{formatEthPrice(event.ticketPrice)}</span>
                <span className="text-sm text-[var(--ce-on-surface-variant)]">
                  {event.sold}/{event.maxSupply}
                </span>
                <Badge tone={status === "Active" ? "success" : status === "Upcoming" ? "info" : "neutral"}>
                  {status}
                </Badge>
                <MoreVertical size={18} aria-hidden="true" className="text-[var(--ce-outline)]" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="p-6">
          <EmptyState title={state.title} detail={state.detail} />
        </div>
      )}
    </Panel>
  );
}

export function ScannerAssignments() {
  const dashboard = useChainEventsDashboard();
  const assignments = dashboard.data?.scannerAssignments ?? [];
  const state = getWalletDataState({
    isConnected: dashboard.isConnected,
    isSepolia: dashboard.isSepolia,
    isLoading: dashboard.isLoading,
    isError: dashboard.isError,
    configured: dashboard.data?.configured,
    compatible: dashboard.data?.compatible,
    error: dashboard.data?.error,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {assignments.length > 0 ? (
        assignments.map((assignment) => (
          <Link
            key={assignment.eventId}
            href={`/scanner/${assignment.eventId}`}
            className="grid min-h-20 grid-cols-[48px_1fr_auto] items-center gap-4 rounded-[var(--ce-radius-lg)] border border-[var(--ce-outline-variant)] bg-white p-4 transition hover:border-[var(--ce-secondary)]"
          >
            <span className="flex size-12 items-center justify-center rounded-[var(--ce-radius)] bg-[var(--ce-secondary-container)] text-[var(--ce-secondary)]">
              <ScanLine size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-semibold">{assignment.event.name}</span>
              <span className="block text-sm text-[var(--ce-on-surface-variant)]">
                Scanner permission active
              </span>
            </span>
            <span aria-hidden="true" className="text-2xl text-[var(--ce-outline)]">
              ›
            </span>
          </Link>
        ))
      ) : (
        <>
          <Panel className="p-5">
            <div className="grid min-h-20 grid-cols-[48px_1fr] items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-[var(--ce-radius)] bg-[var(--ce-secondary-container)] text-[var(--ce-secondary)]">
                <ScanLine size={22} aria-hidden="true" />
              </span>
              <EmptyState title={state.title} detail={state.detail} />
            </div>
          </Panel>
          <Panel className="p-5">
            <div className="grid min-h-20 grid-cols-[48px_1fr] items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-[var(--ce-radius)] bg-[var(--ce-surface-container-high)] text-[var(--ce-on-surface-variant)]">
                <Lock size={22} aria-hidden="true" />
              </span>
              <p className="text-sm leading-6 text-[var(--ce-on-surface-variant)]">
                Scanner permissions are reconstructed from `ScannerUpdated` logs and confirmed with
                `scannerAllowed`.
              </p>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

export function DashboardTicketStack() {
  const dashboard = useChainEventsDashboard();
  const tickets = dashboard.data?.tickets ?? [];
  const state = getWalletDataState({
    isConnected: dashboard.isConnected,
    isSepolia: dashboard.isSepolia,
    isLoading: dashboard.isLoading,
    isError: dashboard.isError,
    configured: dashboard.data?.configured,
    compatible: dashboard.data?.compatible,
    error: dashboard.data?.error,
  });

  return (
    <div className="grid gap-5">
      {tickets.length > 0 ? (
        tickets.slice(0, 3).map((ticket) => (
          <article
            key={ticket.tokenId}
            className="relative overflow-hidden rounded-[var(--ce-radius-lg)] border border-[var(--ce-outline-variant)] bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <Badge tone={ticket.used ? "neutral" : "success"}>
                {ticket.used ? "Checked In" : "Valid"}
              </Badge>
              <Ticket size={22} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
            </div>
            <h3 className="mt-7 text-xl font-semibold leading-7">{ticket.event.name}</h3>
            <p className="mt-2 text-sm text-[var(--ce-on-surface-variant)]">
              {formatEventDate(ticket.event.startTime, ticket.event.endTime)}
            </p>
            <div className="mt-8 grid grid-cols-[1fr_auto] items-end gap-4">
              <div className="ce-label">
                <p className="text-[var(--ce-on-surface-variant)]">Token ID: #{ticket.tokenId}</p>
                <p>{shortenAddress(ticket.owner)}</p>
              </div>
              <div className="flex size-20 items-center justify-center rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface-container-low)]">
                <Ticket size={30} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
              </div>
            </div>
          </article>
        ))
      ) : (
        <article className="relative overflow-hidden rounded-[var(--ce-radius-lg)] border border-[var(--ce-outline-variant)] bg-white p-5">
          <div className="flex justify-end">
            <Ticket size={22} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
          </div>
          <EmptyState title={state.title} detail={state.detail} />
        </article>
      )}
    </div>
  );
}
