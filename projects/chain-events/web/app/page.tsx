import { CirclePlus } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  DashboardTicketStack,
  EventsTable,
  ScannerAssignments,
} from "@/components/sections/dashboard-sections";
import { ButtonLink, PageIntro } from "@/components/ui/primitives";

export default function DashboardPage() {
  return (
    <AppShell active="dashboard">
      <div className="grid gap-8">
        <PageIntro
          title="Dashboard"
          description="Manage your events, tickets, and scanning permissions."
          action={
            <ButtonLink
              href="/create-event"
              className="min-h-14 px-7 text-lg"
              style={{ color: "#fff" }}
            >
              <CirclePlus size={22} aria-hidden="true" color="currentColor" />
              Create Paid Event
            </ButtonLink>
          }
        />
        <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
          <div className="grid content-start gap-7">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-semibold leading-8">Events I Organize</h2>
                <a href="#" className="ce-label text-[var(--ce-secondary)]">
                  View All
                </a>
              </div>
              <EventsTable />
            </div>
            <div>
              <h2 className="mb-5 text-2xl font-semibold leading-8">Events I Can Scan</h2>
              <ScannerAssignments />
            </div>
          </div>
          <div>
            <h2 className="mb-5 text-2xl font-semibold leading-8">Tickets I Own</h2>
            <DashboardTicketStack />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
