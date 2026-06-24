import Link from "next/link";
import type { ReactNode } from "react";

import { WalletStatus } from "@/components/wallet-status";

export interface AppShellProps {
  children: ReactNode;
  active: "dashboard" | "buy" | "create" | "tickets" | "scanner" | "event";
  admin?: boolean;
}

const navItems = [
  { href: "/", label: "Dashboard", key: "dashboard" },
  { href: "/buy", label: "Buy Tickets", key: "buy" },
  { href: "/create-event", label: "Create Event", key: "create" },
  { href: "/tickets", label: "My Tickets", key: "tickets" },
] as const;

export function AppShell({ children, active, admin }: Readonly<AppShellProps>) {
  return (
    <div className="min-h-screen bg-[var(--ce-surface)] text-[var(--ce-on-surface)]">
      <header className="border-b border-[var(--ce-outline-variant)]">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1920px] items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" className="text-[24px] font-bold leading-8 text-black md:text-[26px]">
            ChainEvents
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={
                  active === item.key
                    ? "border-b-2 border-[var(--ce-secondary)] px-0.5 py-5 text-[16px] font-semibold leading-6 text-[var(--ce-secondary)]"
                    : "border-b-2 border-transparent px-0.5 py-5 text-[16px] leading-6 text-[var(--ce-on-surface-variant)] transition hover:text-[var(--ce-on-surface)]"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <WalletStatus />
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100vh-162px)] w-full max-w-[1920px] px-4 py-8 md:px-8 md:py-10">
        {children}
      </main>
      <footer className="border-t border-[var(--ce-outline-variant)] bg-[var(--ce-surface-container-low)]">
        <div className="mx-auto flex min-h-[96px] w-full max-w-[1920px] flex-col justify-center gap-4 px-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="ce-label font-semibold text-black">
              ChainEvents{admin ? " Admin Console" : ""}
            </p>
            <p className="mt-2 text-sm text-[var(--ce-on-surface-variant)]">
              © 2024 ChainEvents. All rights reserved.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="ce-label flex flex-wrap gap-5 text-[var(--ce-on-surface-variant)]"
          >
            <Link href="/events/1">Contract Info</Link>
            <Link href="/">Network Status</Link>
            <Link href="/">Support</Link>
            <Link href="/">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
