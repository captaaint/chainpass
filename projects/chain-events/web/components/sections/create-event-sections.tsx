import { Blocks, CirclePlus, Info, WalletCards } from "lucide-react";

import {
  Button,
  Field,
  Panel,
  TextAreaField,
} from "@/components/ui/primitives";

export function CreateEventForm() {
  return (
    <Panel className="p-6 md:p-8">
      <form className="grid gap-6">
        <Field label="Event Name" placeholder="e.g. Web3 Builders Summit" />
        <TextAreaField label="Description" placeholder="Describe the utility and value of this event..." />
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Start Date & Time" type="datetime-local" />
          <Field label="End Date & Time" type="datetime-local" />
          <Field label="Ticket Price (ETH)" placeholder="0.05" />
          <Field label="Max Ticket Supply" placeholder="500" />
        </div>
        <Field label="Treasury Wallet Address" placeholder="0x..." />
        <div className="border-t border-[var(--ce-outline-variant)] pt-6">
          <Button className="min-h-14 w-full text-lg">
            <CirclePlus size={22} aria-hidden="true" />
            Create Event
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export function CreateEventAside() {
  return (
    <aside className="grid content-start gap-6">
      <Panel className="bg-[var(--ce-surface-container-high)] p-6">
        <h2 className="flex items-center gap-3 text-xl font-semibold">
          <Info size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          On-Chain Logistics
        </h2>
        <div className="mt-6 grid gap-6 text-sm leading-6 text-[var(--ce-on-surface-variant)]">
          <p className="grid grid-cols-[28px_1fr] gap-3">
            <Blocks size={20} aria-hidden="true" />
            <span>A unique ERC-721 contract will be deployed to manage ticket ownership and transfers.</span>
          </p>
          <p className="grid grid-cols-[28px_1fr] gap-3">
            <WalletCards size={20} aria-hidden="true" />
            <span>Proceeds are instantly routed to the treasury address upon every successful minting transaction.</span>
          </p>
        </div>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="h-40 bg-[radial-gradient(circle_at_70%_35%,rgba(87,223,254,.6),transparent_22%),linear-gradient(135deg,#07111f,#153d47_58%,#05080e)]" />
        <div className="p-5">
          <p className="ce-label font-semibold text-[var(--ce-on-surface)]">Preview Mode</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ce-on-surface-variant)]">
            Your ticket landing page will be generated automatically based on these parameters.
          </p>
        </div>
      </Panel>
    </aside>
  );
}
