import { BadgeCheck, KeyRound, Lock, RotateCcw, ShieldX } from "lucide-react";

import {
  Badge,
  Button,
  Field,
  Panel,
  ScannerViewport,
  StatusCallout,
} from "@/components/ui/primitives";

export function ScannerConsole() {
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
        <Panel className="border-l-4 border-l-[var(--ce-success)] p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge tone="success">Valid Ticket</Badge>
              <h2 className="mt-4 text-2xl font-semibold">Alex Rivera</h2>
            </div>
            <div className="size-20 rounded-[var(--ce-radius)] bg-[linear-gradient(135deg,#17212d,#d8e5ee)]" />
          </div>
          <dl className="mt-6 grid gap-4 border-t border-[var(--ce-outline-variant)] pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--ce-on-surface-variant)]">Ticket Type</dt>
              <dd className="font-semibold">VIP Backstage Pass</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ce-on-surface-variant)]">Wallet Address</dt>
              <dd className="ce-label text-[var(--ce-secondary)]">0x8892...f2e1</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ce-on-surface-variant)]">Token ID</dt>
              <dd className="ce-label">#4029</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ce-on-surface-variant)]">Status</dt>
              <dd className="inline-flex items-center gap-2 font-semibold text-[var(--ce-success)]">
                <BadgeCheck size={17} aria-hidden="true" />
                Ready to Check-In
              </dd>
            </div>
          </dl>
          <Button className="mt-8 min-h-14 w-full text-lg">Check In</Button>
        </Panel>
        <StatusCallout icon={RotateCcw} title="Already Checked In" tone="warning">
          Last seen: 14:22 at Main Entrance
        </StatusCallout>
        <StatusCallout icon={ShieldX} title="Invalid Ticket" tone="danger">
          The provided signature does not match any token.
        </StatusCallout>
        <StatusCallout icon={Lock} title="No Permission">
          Restricted to Admin staff accounts.
        </StatusCallout>
        <Panel className="bg-[var(--ce-primary-container)] p-7 text-[var(--ce-inverse-on-surface)]">
          <p className="ce-label uppercase opacity-60">Staff Session</p>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-[36px] font-bold leading-none">124</p>
              <p className="ce-label mt-2 opacity-60">Successful Scans</p>
            </div>
            <div className="text-right">
              <p className="text-[36px] font-bold leading-none text-[var(--ce-secondary)]">98%</p>
              <p className="ce-label mt-2 opacity-60">Quotas Filled</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
