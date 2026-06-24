import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { TicketDetailContent } from "@/components/sections/ticket-detail-sections";

export default async function TicketDetailPage({
  params,
}: Readonly<{
  params: Promise<{ tokenId: string }>;
}>) {
  const { tokenId } = await params;

  return (
    <AppShell active="tickets">
      <div className="grid gap-8">
        <Link
          href="/tickets"
          className="ce-label inline-flex w-fit items-center gap-2 uppercase text-[var(--ce-on-surface-variant)] transition hover:text-[var(--ce-on-surface)]"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Back to My Tickets
        </Link>
        <TicketDetailContent tokenIdParam={tokenId} />
      </div>
    </AppShell>
  );
}
