"use client";

import { Lock, RotateCcw, ShieldX } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";

import {
  Button,
  EmptyState,
  Field,
  Panel,
  ScannerViewport,
  StatusCallout,
} from "@/components/ui/primitives";

export function ScannerConsole() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const isSepolia = chainId === sepolia.id;
  const state = !isConnected
    ? {
        title: "Wallet disconnected",
        detail: "Connect MetaMask to verify scanner permissions for this event.",
      }
    : !isSepolia
      ? {
          title: "Wrong network",
          detail: "Switch to Sepolia before reading scanner permissions or ticket validity.",
        }
      : {
          title: "Scanner contract data not connected yet",
          detail: "Ticket validation will use scannerAllowed, isValidTicket, tokenUsed, and checkIn.",
        };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.8fr]">
      <div className="grid content-start gap-5">
        <ScannerViewport />
        <Panel className="bg-[var(--ce-surface-container-low)] p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="Manual Ticket ID / Wallet Address" placeholder="Enter Token ID or 0x..." />
            <Button className="min-h-11 px-8">Validate</Button>
          </div>
        </Panel>
      </div>
      <div className="grid content-start gap-5">
        <Panel className="border-l-4 border-l-[var(--ce-outline-variant)] p-7">
          <EmptyState title={state.title} detail={state.detail} />
          <Button className="mt-8 min-h-14 w-full text-lg" disabled>
            Check In
          </Button>
        </Panel>
        <StatusCallout icon={RotateCcw} title="Already Checked In" tone="warning">
          This state will come from `tokenUsed` and indexed `TicketCheckedIn` events.
        </StatusCallout>
        <StatusCallout icon={ShieldX} title="Invalid Ticket" tone="danger">
          Invalid results will come from `isValidTicket` and token ownership reads.
        </StatusCallout>
        <StatusCallout icon={Lock} title="No Permission">
          Scanner access will come from `scannerAllowed` for the connected wallet.
        </StatusCallout>
        <Panel className="bg-[var(--ce-primary-container)] p-7 text-[var(--ce-inverse-on-surface)]">
          <p className="ce-label uppercase opacity-60">Staff Session</p>
          <p className="mt-5 text-sm leading-6 opacity-70">
            Scan counts and attendance totals will be derived from ChainEvents indexed logs.
          </p>
        </Panel>
      </div>
    </div>
  );
}
