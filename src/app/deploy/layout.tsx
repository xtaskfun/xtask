import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deploy escrow — xtask.fun",
  robots: { index: false, follow: false },
};

export default function DeployLayout({ children }: { children: React.ReactNode }) {
  return children;
}
