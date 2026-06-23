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
        Web3 Global Summit 2024
      </h1>
      <div className="mt-6 flex flex-wrap gap-6 text-base text-[var(--ce-on-surface-variant)]">
        <span className="inline-flex items-center gap-3">
          <CalendarDays size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          Nov 24 - Nov 26, 2024
        </span>
        <span className="inline-flex items-center gap-3">
          <MapPin size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          Metaverse Convention Center
        </span>
        <span className="inline-flex items-center gap-3">
          <UserRound size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          0x88...f2e1
        </span>
      </div>
      <p className="mt-8 max-w-5xl text-lg leading-8">
        Join the brightest minds in decentralized finance, NFT infrastructure, and cross-chain
        interoperability. A three-day intensive summit featuring keynote speakers, developer
        workshops, and the legendary annual networking gala. This event is fully token-gated via
        the ChainEvents protocol.
      </p>
    </Panel>
  );
}

export function EventMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard label="Price" value={<><span>0.05</span> <span className="ce-label text-[var(--ce-secondary)]">ETH</span></>} detail="~$124.50 USD" />
      <MetricCard
        label="Availability"
        value={<><span>482</span> <span className="ce-label text-[var(--ce-on-surface-variant)]">/ 500</span></>}
        detail={<span className="block h-2 rounded-full bg-[var(--ce-surface-container-high)]"><span className="block h-2 w-[86%] rounded-full bg-[var(--ce-secondary)]" /></span>}
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
          <div className="mt-4 flex items-center justify-between rounded-[var(--ce-radius)] bg-[var(--ce-surface-container-high)] px-3 py-3">
            <span className="ce-label">0x12...abc</span>
            <button className="text-[var(--ce-error)]" type="button">×</button>
          </div>
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
        <Badge tone="success">Active</Badge>
      </div>
      <Panel emphasis="strong" className="p-7">
        <h2 className="text-2xl font-semibold">Secure Ticket</h2>
        <div className="mt-8 grid gap-5 text-base">
          <div className="flex justify-between border-b border-[var(--ce-outline-variant)] pb-4">
            <span className="text-[var(--ce-on-surface-variant)]">Standard Ticket</span>
            <span className="ce-label">0.05 ETH</span>
          </div>
          <div className="flex justify-between border-b border-[var(--ce-outline-variant)] pb-4">
            <span className="text-[var(--ce-on-surface-variant)]">Estimated Gas</span>
            <span className="ce-label text-[var(--ce-secondary)]">~0.002 ETH</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total Cost</span>
            <span>0.052 ETH</span>
          </div>
        </div>
        <Button className="mt-8 min-h-14 w-full text-lg">Buy Ticket</Button>
        <p className="mt-5 text-center text-sm text-[var(--ce-on-surface-variant)]">
          Single transaction on <strong>Sepolia</strong> network.
        </p>
      </Panel>
      <Panel className="bg-[var(--ce-surface-container-low)] p-6">
        <p className="ce-label uppercase text-[var(--ce-on-surface-variant)]">Contract Information</p>
        <dl className="mt-5 grid gap-5">
          <div>
            <dt className="ce-label-sm text-[var(--ce-on-surface-variant)]">Event Contract</dt>
            <dd className="ce-label mt-1">0x4567...89ab</dd>
          </div>
          <div>
            <dt className="ce-label-sm text-[var(--ce-on-surface-variant)]">Token Standard</dt>
            <dd className="ce-label mt-1">ERC-721A (Gas Optimized)</dd>
          </div>
        </dl>
      </Panel>
    </aside>
  );
}
