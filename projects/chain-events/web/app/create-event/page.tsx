import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  CreateEventAside,
  CreateEventForm,
} from "@/components/sections/create-event-sections";
import { PageIntro } from "@/components/ui/primitives";

export default function CreateEventPage() {
  return (
    <AppShell active="create">
      <div className="mx-auto grid max-w-[1440px] gap-8">
        <Link
          href="/"
          className="ce-label inline-flex w-fit items-center gap-2 text-[var(--ce-on-surface-variant)] transition hover:text-[var(--ce-on-surface)]"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Back to Dashboard
        </Link>
        <PageIntro
          title="Create Paid Event"
          description="Deploy a new event contract and configure on-chain ticketing parameters."
        />
        <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          <CreateEventForm />
          <CreateEventAside />
        </section>
      </div>
    </AppShell>
  );
}
