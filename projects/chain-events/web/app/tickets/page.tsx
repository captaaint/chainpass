import { AppShell } from "@/components/app-shell";
import {
  PageIntro,
  SearchToolbar,
  TicketPreviewCard,
} from "@/components/ui/primitives";
import { tickets } from "@/data/mock-data";

export default function TicketsPage() {
  return (
    <AppShell active="tickets">
      <div className="grid gap-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_minmax(360px,0.48fr)] lg:items-end">
          <PageIntro
            title="Ticket Gallery"
            description="Manage your on-chain event access passes and digital collectibles."
          />
          <SearchToolbar />
        </div>
        <section className="grid gap-6 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <TicketPreviewCard
              key={ticket.id}
              title={ticket.title}
              subtitle={ticket.subtitle}
              id={ticket.id}
              badge={ticket.badge}
              variant={ticket.variant}
              disabled={ticket.disabled}
              highlighted={ticket.highlighted}
            />
          ))}
        </section>
      </div>
    </AppShell>
  );
}
