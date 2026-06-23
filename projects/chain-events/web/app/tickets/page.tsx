import { AppShell } from "@/components/app-shell";
import { TicketGallery } from "@/components/sections/tickets-sections";
import { PageIntro, SearchToolbar } from "@/components/ui/primitives";

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
        <TicketGallery />
      </div>
    </AppShell>
  );
}
