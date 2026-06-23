import { CalendarDays, MapPin, ShieldCheck, UserRound } from "lucide-react";

import {
  Badge,
  Button,
  Field,
  MetricCard,
  Panel,
} from "@/components/ui/primitives";

export function EventHero() {
  return (
    <Panel className="p-8 md:p-10">
      <h1 className="text-[34px] font-bold leading-[42px] tracking-[-0.02em]">
        Event details unavailable
      </h1>
      <div className="mt-6 flex flex-wrap gap-6 text-base text-[var(--ce-on-surface-variant)]">
        <span className="inline-flex items-center gap-3">
          <CalendarDays size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          Awaiting contract read
        </span>
        <span className="inline-flex items-center gap-3">
          <MapPin size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          Metadata indexer not connected
        </span>
        <span className="inline-flex items-center gap-3">
          <UserRound size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          Organizer from contract
        </span>
      </div>
      <p className="mt-8 max-w-5xl text-lg leading-8">
        This screen no longer uses placeholder event data. It will be populated from
        `getEvent(eventId)` and indexed event metadata after the ChainEvents contract integration is
        wired.
      </p>
    </Panel>
  );
}

export function EventMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard label="Price" value={<span>--</span>} detail="Read from getEvent" />
      <MetricCard
        label="Availability"
        value={<span>--</span>}
        detail="Derived from max supply and ticket purchases"
      />
      <MetricCard
        label="Protocol"
        value={<span className="inline-flex items-center gap-2 text-2xl"><ShieldCheck className="text-[var(--ce-secondary)]" size={26} aria-hidden="true" /> ERC-721</span>}
        detail="Secure Minting"
      />
    </div>
  );
}

export function OrganizerControls() {
  return (
    <Panel className="bg-[var(--ce-surface-container-low)] p-6">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <ShieldCheck size={24} aria-hidden="true" />
        Organizer Controls
      </h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Panel className="p-5">
          <Field label="Scanner Wallets" placeholder="0x..." />
          <p className="mt-4 text-sm text-[var(--ce-on-surface-variant)]">
            Scanner wallets will come from `ScannerUpdated` logs and `scannerAllowed` reads.
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="ce-label uppercase text-[var(--ce-on-surface-variant)]">Danger Zone</p>
          <p className="mt-4 text-sm text-[var(--ce-on-surface-variant)]">
            Deactivating the event will pause all sales immediately.
          </p>
          <Button tone="danger" className="mt-8 w-full">
            Deactivate Event
          </Button>
        </Panel>
      </div>
    </Panel>
  );
}

export function PurchasePanel() {
  return (
    <aside className="grid content-start gap-6">
      <div className="flex justify-end">
        <Badge tone="neutral">Contract data pending</Badge>
      </div>
      <Panel emphasis="strong" className="p-7">
        <h2 className="text-2xl font-semibold">Secure Ticket</h2>
        <div className="mt-8 grid gap-5 text-base">
          <div className="flex justify-between border-b border-[var(--ce-outline-variant)] pb-4">
            <span className="text-[var(--ce-on-surface-variant)]">Standard Ticket</span>
            <span className="ce-label">-- ETH</span>
          </div>
          <div className="flex justify-between border-b border-[var(--ce-outline-variant)] pb-4">
            <span className="text-[var(--ce-on-surface-variant)]">Estimated Gas</span>
            <span className="ce-label text-[var(--ce-secondary)]">Wallet estimates at signing</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total Cost</span>
            <span>Unavailable</span>
          </div>
        </div>
        <Button className="mt-8 min-h-14 w-full text-lg" disabled>
          Buy Ticket
        </Button>
        <p className="mt-5 text-center text-sm text-[var(--ce-on-surface-variant)]">
          Ticket purchase will be enabled after contract address, ABI, and reads are connected.
        </p>
      </Panel>
      <Panel className="bg-[var(--ce-surface-container-low)] p-6">
        <p className="ce-label uppercase text-[var(--ce-on-surface-variant)]">Contract Information</p>
        <dl className="mt-5 grid gap-5">
          <div>
            <dt className="ce-label-sm text-[var(--ce-on-surface-variant)]">Event Contract</dt>
            <dd className="ce-label mt-1">NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS</dd>
          </div>
          <div>
            <dt className="ce-label-sm text-[var(--ce-on-surface-variant)]">Token Standard</dt>
            <dd className="ce-label mt-1">ERC-721</dd>
          </div>
        </dl>
      </Panel>
    </aside>
  );
}
