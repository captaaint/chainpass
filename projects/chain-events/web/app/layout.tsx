import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChainEvents",
  description: "Operational console for paid on-chain event ticketing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
