import Link from "next/link";
import TrendingTasks from "@/components/TaskGrid";
import { VERIFICATION_MODE, X_HANDLE, X_URL } from "@/lib/site";

const STATS = [
  { label: "Rewards paid", value: "$248K" },
  { label: "Active tasks", value: "1,204" },
  { label: "Hunters", value: "38K+" },
  { label: "Projects", value: "620" },
];

const STEPS = [
  { n: "01", title: "Connect wallet", text: "Pick from MetaMask, OKX, Trust, Phantom, Coinbase and more." },
  VERIFICATION_MODE === "x"
    ? { n: "02", title: "Link your X", text: "Connect your X account so we can verify your engagement." }
    : { n: "02", title: "Pick a task", text: "Browse open campaigns and choose the rewards you like." },
  { n: "03", title: "Do tasks", text: "Follow, like, repost, reply or quote — each task takes seconds." },
  { n: "04", title: "Claim", text: "Hit Claim and the reward lands straight in your wallet." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 text-center md:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="pointer-events-none absolute left-1/2 top-16 -z-10 h-56 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-rainbow opacity-25 blur-[110px]" />

        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-rainbow" /> Live on Base, Ethereum, Arbitrum & more
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
          Engage on X.<br />Earn <span className="text-rainbow">onchain</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-muted md:text-lg">
          Complete simple X tasks for crypto rewards — or launch a campaign and grow your project with real engagement.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/tasks" className="btn-primary">Start earning →</Link>
          <Link href="/create" className="btn-rainbow">Create a task</Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-surface p-6 text-center">
            <div className="text-2xl font-bold md:text-3xl">{s.value}</div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Featured */}
      <section className="mt-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">🔥 Trending tasks</h2>
            <p className="text-sm text-muted">Filling up fastest right now</p>
          </div>
          <Link href="/tasks" className="text-sm text-muted hover:text-white">View all →</Link>
        </div>
        <TrendingTasks />
      </section>

      {/* How it works */}
      <section className="mt-20">
        <h2 className="mb-6 text-2xl font-bold">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-card p-5">
              <div className="text-rainbow font-mono text-sm font-bold">{s.n}</div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-rainbow relative mt-20 overflow-hidden rounded-3xl p-8 md:p-12">
        <h2 className="text-2xl font-bold md:text-3xl">Got a project to grow?</h2>
        <p className="mt-2 max-w-lg text-muted">
          Fund a campaign in any token, set the actions you want, and let thousands of real users boost your post.
        </p>
        <Link href="/create" className="btn-primary mt-6">Launch campaign</Link>
      </section>

      {/* Follow on X */}
      <section className="mt-20 flex flex-col items-center gap-4 rounded-3xl border border-line bg-surface p-8 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <h2 className="text-xl font-bold">Never miss a new task</h2>
          <p className="mt-1 text-sm text-muted">New campaigns, raids and updates are posted on X first.</p>
        </div>
        <a href={X_URL} target="_blank" rel="noreferrer noopener" className="btn-rainbow shrink-0 px-6 py-3">
          <span className="font-black">𝕏</span> Follow @{X_HANDLE}
        </a>
      </section>
    </>
  );
}
