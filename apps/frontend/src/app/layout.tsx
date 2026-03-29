import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { RouteShell } from "@/components/layout/route-shell";
import { Providers } from "@/providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  title: "arcetis",
  description: "Arcetis gamified rewards platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans`}>
        <Providers>
          <RouteShell>{children}</RouteShell>
        </Providers>
      </body>
    </html>
  );
}
