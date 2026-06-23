"use client";

import { Ticket } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";

import { EmptyState, Panel } from "@/components/ui/primitives";

function useTicketGalleryState() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) {
    return {
      title: "Wallet disconnected",
      detail: "Connect MetaMask to load tickets owned by your wallet.",
    };
  }

  if (chainId !== sepolia.id) {
    return {
      title: "Wrong network",
      detail: "Switch to Sepolia before reading wallet ticket ownership.",
    };
  }

  return {
    title: "Ticket ownership not connected yet",
    detail: "Owned tickets will come from ChainEvents contract reads and indexed transfer events.",
  };
}

export function TicketGallery() {
  const state = useTicketGalleryState();

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <Panel className="p-6 lg:col-span-3">
        <div className="mb-4 flex justify-end">
          <Ticket size={22} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
        </div>
        <EmptyState title={state.title} detail={state.detail} />
      </Panel>
    </section>
  );
}
