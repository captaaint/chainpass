import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EventDetailContent } from "@/components/sections/event-detail-sections";

export default async function EventDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

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
        <EventDetailContent eventId={id} />
      </div>
    </AppShell>
  );
}
