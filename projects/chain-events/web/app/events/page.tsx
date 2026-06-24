import { CalendarDays } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EventsListingContent } from "@/components/sections/events-listing-sections";
import { PageIntro } from "@/components/ui/primitives";

export default function EventsPage() {
  return (
    <AppShell active="events">
      <div className="grid gap-7">
        <PageIntro
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} aria-hidden="true" />
              Sepolia events
            </span>
          }
          title="Events"
          description="Browse available ChainEvents and open an event to review details or buy a transferable NFT ticket."
        />
        <EventsListingContent />
      </div>
    </AppShell>
  );
}
