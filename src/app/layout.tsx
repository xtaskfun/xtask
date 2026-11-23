import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Aurora from "@/components/Aurora";
import PauseBanner from "@/components/PauseBanner";
import { SITE_URL, X_HANDLE } from "@/lib/site";

// Self-hosted variable fonts (from npm), so builds never depend on Google Fonts being reachable.
const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});
const display = localFont({
  src: "../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
  weight: "300 700",
  variable: "--font-display",
  display: "swap",
});

const siteUrl = SITE_URL;

const title = "xtask.fun — Engage on X, earn crypto";
const description = "Complete simple X (Twitter) tasks and earn onchain rewards, or launch a campaign for your project.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: { title, description, siteName: "xtask.fun", type: "website" },
  twitter: { card: "summary_large_image", title, description, site: `@${X_HANDLE}`, creator: `@${X_HANDLE}` },
};

export const viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>
        <Aurora />
        <Providers>
          <PauseBanner />
          <Navbar />
          <main className="mx-auto max-w-6xl px-4">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
