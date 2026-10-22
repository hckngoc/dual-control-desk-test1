import { Providers } from "./providers";
export const metadata = {
  title: "Dual-Control Expense Desk | RMIT_SGS_N3T_C2",
  description: "Independent expense approvals with TideCloak identity and mock settlement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
