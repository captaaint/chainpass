"use client";

import { Lock, ScanLine, Ticket } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";

import { EmptyState, Panel } from "@/components/ui/primitives";

function useWalletDataState() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) {
    return {
      title: "Wallet disconnected",
      detail: "Connect MetaMask to load wallet-specific ChainEvents data.",
    };
  }

  if (chainId !== sepolia.id) {
    return {
      title: "Wrong network",
      detail: "Switch to Sepolia to read ChainEvents contract and indexer data.",
    };
  }

  return {
    title: "Contract data not connected yet",
    detail: "This section will be populated from ChainEvents contract reads and indexed events.",
  };
}

export function EventsTable() {
  const state = useWalletDataState();

  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-[1.4fr_.7fr_.45fr_.55fr_.55fr_32px] gap-4 border-b border-[var(--ce-outline-variant)] bg-[var(--ce-surface-container-low)] px-6 py-4">
        {["Event Name", "Date", "Price", "Supply", "Status", ""].map((header) => (
          <span key={header} className="ce-label uppercase text-[var(--ce-on-surface-variant)]">
            {header}
          </span>
        ))}
      </div>
      <div className="p-6">
        <EmptyState title={state.title} detail={state.detail} />
      </div>
    </Panel>
  );
}

export function ScannerAssignments() {
  const state = useWalletDataState();

  return (
    <div className="grid gap-4 md:grid-cols-2">
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
            Scanner permissions will come from indexed `ScannerUpdated` events and on-chain
            permission checks.
          </p>
        </div>
      </Panel>
    </div>
  );
}

export function DashboardTicketStack() {
  const state = useWalletDataState();

  return (
    <div className="grid gap-5">
      <article className="relative overflow-hidden rounded-[var(--ce-radius-lg)] border border-[var(--ce-outline-variant)] bg-white p-5">
        <div className="flex justify-end">
          <Ticket size={22} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
        </div>
        <EmptyState title={state.title} detail={state.detail} />
      </article>
    </div>
  );
}
