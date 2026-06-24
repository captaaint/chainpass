import { ShoppingCart } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { BuyTicketsContent } from "@/components/sections/buy-tickets-sections";
import { PageIntro } from "@/components/ui/primitives";

export default function BuyTicketsPage() {
  return (
    <AppShell active="buy">
      <div className="grid gap-7">
        <PageIntro
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <ShoppingCart size={16} aria-hidden="true" />
              Sepolia marketplace
            </span>
          }
          title="Buy Tickets"
          description="Browse active ChainEvents ticket inventory and buy transferable ERC-721 tickets with ETH."
        />
        <BuyTicketsContent />
      </div>
    </AppShell>
  );
}
