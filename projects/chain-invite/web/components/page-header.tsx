import type { ReactNode } from "react";

import { WalletStatus } from "./wallet-status";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-[#d8d2c6] pb-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5f6f52]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[#1d2527] md:text-3xl">
          {title}
        </h1>
        {children}
      </div>
      <WalletStatus />
    </header>
  );
}
