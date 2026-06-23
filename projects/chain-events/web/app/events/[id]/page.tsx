import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  EventHero,
  EventMetrics,
  OrganizerControls,
  PurchasePanel,
} from "@/components/sections/event-detail-sections";

export default function EventDetailPage() {
  return (
    <AppShell active="event">
      <div className="grid gap-8">
        <Link
          href="/"
          className="ce-label inline-flex w-fit items-center gap-2 uppercase text-[var(--ce-on-surface-variant)] transition hover:text-[var(--ce-on-surface)]"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Back to Dashboard
        </Link>
        <section className="grid gap-7 xl:grid-cols-[minmax(0,2fr)_minmax(360px,.95fr)]">
          <div className="grid content-start gap-7">
            <EventHero />
            <EventMetrics />
            <OrganizerControls />
          </div>
          <PurchasePanel />
        </section>
      </div>
    </AppShell>
  );
}
