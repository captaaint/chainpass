import Link from "next/link";
import { Box, Lock, MoreVertical, ScanLine, Ticket } from "lucide-react";

import { dashboardTickets, events, scannerEvents } from "@/data/mock-data";
import { Badge, EmptyState, Panel } from "@/components/ui/primitives";

export function EventsTable() {
  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-[1.4fr_.7fr_.45fr_.55fr_.55fr_32px] gap-4 border-b border-[var(--ce-outline-variant)] bg-[var(--ce-surface-container-low)] px-6 py-4">
        {["Event Name", "Date", "Price", "Supply", "Status", ""].map((header) => (
          <span key={header} className="ce-label uppercase text-[var(--ce-on-surface-variant)]">
            {header}
          </span>
        ))}
      </div>
      <div className="divide-y divide-[var(--ce-outline-variant)]">
        {events.map((event, index) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="grid grid-cols-[1.4fr_.7fr_.45fr_.55fr_.55fr_32px] items-center gap-4 px-6 py-5 transition hover:bg-[var(--ce-surface-container-low)]"
          >
            <span className="flex min-w-0 items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--ce-radius)] bg-[var(--ce-info-container)] text-[var(--ce-info)]">
                {index === 0 ? <Box size={22} aria-hidden="true" /> : <Ticket size={22} aria-hidden="true" />}
              </span>
              <span className="truncate text-xl font-semibold">{event.name}</span>
            </span>
            <span className="text-sm text-[var(--ce-on-surface-variant)]">{event.date}</span>
            <span className="ce-label">{event.price}</span>
            <span className="text-sm text-[var(--ce-on-surface-variant)]">{event.supply}</span>
            <Badge tone={event.status === "Active" ? "success" : "info"}>{event.status}</Badge>
            <MoreVertical size={18} aria-hidden="true" className="text-[var(--ce-outline)]" />
          </Link>
        ))}
      </div>
    </Panel>
  );
}

export function ScannerAssignments() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {scannerEvents.map((event) => (
        <Link
          key={event.id}
          href={`/scanner/${event.id}`}
          className="grid min-h-20 grid-cols-[48px_1fr_auto] items-center gap-4 rounded-[var(--ce-radius-lg)] border border-[var(--ce-outline-variant)] bg-white p-4 transition hover:border-[var(--ce-secondary)]"
        >
          <span className="flex size-12 items-center justify-center rounded-[var(--ce-radius)] bg-[var(--ce-secondary-container)] text-[var(--ce-secondary)]">
            {event.locked ? <Lock size={22} aria-hidden="true" /> : <ScanLine size={22} aria-hidden="true" />}
          </span>
          <span>
            <span className="block text-lg font-semibold">{event.name}</span>
            <span className="block text-sm text-[var(--ce-on-surface-variant)]">{event.detail}</span>
          </span>
          <span aria-hidden="true" className="text-2xl text-[var(--ce-outline)]">
            ›
          </span>
        </Link>
      ))}
    </div>
  );
}

export function DashboardTicketStack() {
  return (
    <div className="grid gap-5">
      {dashboardTickets.map((ticket) => (
        <article
          key={ticket.id}
          className="relative overflow-hidden rounded-[var(--ce-radius-lg)] border border-[var(--ce-outline-variant)] bg-white p-5"
        >
          <div className="flex items-start justify-between">
            <Badge tone={ticket.badge === "VIP Access" ? "info" : "neutral"}>{ticket.badge}</Badge>
            <Ticket size={22} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
          </div>
          <h3 className="mt-7 text-xl font-semibold leading-7">{ticket.title}</h3>
          <p className="mt-2 text-sm text-[var(--ce-on-surface-variant)]">{ticket.subtitle}</p>
          <div className="mt-8 grid grid-cols-[1fr_auto] items-end gap-4">
            <div className="ce-label">
              <p className="text-[var(--ce-on-surface-variant)]">ID: #{ticket.id}</p>
              <p>0x...{ticket.id === "4092" ? "f3a2" : "e911"}</p>
            </div>
            <div className="flex size-20 items-center justify-center rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface-container-low)]">
              <Ticket size={30} aria-hidden="true" className="text-[var(--ce-on-surface-variant)]" />
            </div>
          </div>
        </article>
      ))}
      <EmptyState title="No more tickets" detail="Browse events to acquire more tickets on-chain." />
    </div>
  );
}
