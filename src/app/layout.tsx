import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { X_HANDLE } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://xtask.fun");

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
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
