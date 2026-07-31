import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arc Bridge — USDC Cross-Chain",
  description: "Bridge native USDC to and from Arc using Circle's CCTP V2. No wrapped tokens, no liquidity pools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-arc-dark min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
