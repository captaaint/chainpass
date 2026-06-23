import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ChainInvite",
  description: "Blockchain event invitations and QR check-in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
