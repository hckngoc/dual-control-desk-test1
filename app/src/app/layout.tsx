import "./globals.css";
import { Providers } from "./providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dual-Control Expense Desk | RMIT Hackathon 2026",
  description:
    "Decentralized Maker-Checker Financial Governance powered by TideCloak MultiAdmin, DPoP, and Cryptographic Quorum",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
