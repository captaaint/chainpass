"use client";

import { Ticket } from "lucide-react";

import { useChainEventsDashboard } from "@/components/use-chain-events-dashboard";
import { formatEventDateTime } from "@/lib/chain-events-format";
import { EmptyState, Panel, TicketPreviewCard } from "@/components/ui/primitives";

function getTicketGalleryState({
  isConnected,
  isSepolia,
  isLoading,
  isError,
  configured,
  compatible,
}: {
  isConnected: boolean;
  isSepolia: boolean;
  isLoading: boolean;
  isError: boolean;
  configured?: boolean;
  compatible?: boolean;
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
      detail: "The configured address does not match the current ChainEvents contract. Check .env.local.",
    };
  }

  return {
    title: "No tickets found",
    detail: "This wallet does not currently own tickets discovered from ChainEvents purchase logs.",
  };
}

export function TicketGallery() {
  const dashboard = useChainEventsDashboard();
  const tickets = dashboard.data?.tickets ?? [];
  const state = getTicketGalleryState({
    isConnected: dashboard.isConnected,
    isSepolia: dashboard.isSepolia,
    isLoading: dashboard.isLoading,
    isError: dashboard.isError,
    configured: dashboard.data?.configured,
    compatible: dashboard.data?.compatible,
  });

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      {tickets.length > 0 ? (
        tickets.map((ticket, index) => (
          <TicketPreviewCard
            key={ticket.tokenId}
            title={ticket.event.name}
            subtitle={formatEventDateTime(ticket.event.startTime)}
            id={ticket.tokenId}
            badge={ticket.used ? "Checked In" : "Valid"}
            variant={index % 3 === 0 ? "cyan" : index % 3 === 1 ? "mono" : "gold"}
            disabled={ticket.used}
          />
        ))
      ) : (
        <Panel className="p-6 lg:col-span-3">
          <div className="mb-4 flex justify-end">
            <Ticket size={22} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
          </div>
          <EmptyState title={state.title} detail={state.detail} />
        </Panel>
      )}
    </section>
  );
}
