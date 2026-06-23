import { AppShell } from "@/components/app-shell";
import { ScannerConsole } from "@/components/sections/scanner-sections";
import { PageIntro } from "@/components/ui/primitives";

export default function ScannerPage() {
  return (
    <AppShell active="scanner" admin>
      <div className="grid gap-7">
        <PageIntro
          title="Ticket Validator"
          description="Connect contract data to validate tickets for this event."
        />
        <ScannerConsole />
      </div>
    </AppShell>
  );
}
