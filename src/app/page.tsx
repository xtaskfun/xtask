import Image from "next/image";
import Link from "next/link";
import TrendingTasks from "@/components/TaskGrid";
import Stats from "@/components/Stats";
import HeroVisual from "@/components/HeroVisual";
import Marquee from "@/components/Marquee";
import { VERIFICATION_MODE, X_HANDLE, X_URL } from "@/lib/site";

const STEPS = [
  { icon: "👛", title: "Connect wallet", text: "MetaMask, OKX, Robinhood Wallet, Coinbase and more." },
  VERIFICATION_MODE === "x"
    ? { icon: "𝕏", title: "Link your X", text: "Connect your X account so we can verify your engagement." }
    : { icon: "🎯", title: "Pick a task", text: "Browse open campaigns and choose the rewards you like." },
  { icon: "⚡", title: "Do the task", text: "Follow, like, repost, reply or quote — it takes seconds." },
  { icon: "💰", title: "Claim", text: "Hit Claim and the reward lands straight in your wallet." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="grid items-center gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-24">
        <div className="text-center md:text-left">
          <span className="eyebrow animate-fade-up">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Social tasks · Onchain rewards
          </span>
          <h1 className="mt-6 animate-fade-up text-5xl font-bold leading-[1.02] [animation-delay:80ms] md:text-7xl">
            Engage on X.
            <br />
            Earn <span className="text-rainbow-flow">onchain</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-lg animate-fade-up text-lg text-white/60 [animation-delay:160ms] md:mx-0">
            Do simple tasks on X and claim crypto in one click — or launch a campaign and get your post in front of real people.
          </p>
          <div className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:240ms] md:justify-start">
            <Link href="/tasks" className="btn-primary px-6 py-3 text-base">
              Start earning →
            </Link>
            <Link href="/create" className="btn-rainbow px-6 py-3 text-base">
              Create a task
            </Link>
          </div>
        </div>
        <div className="animate-fade-up [animation-delay:200ms]">
          <HeroVisual />
        </div>
      </section>

      <Marquee />

      {/* Stats */}
      <div className="mt-10">
        <Stats />
      </div>

      {/* Trending */}
      <section className="mt-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Hot right now</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Trending tasks</h2>
          </div>
          <Link href="/tasks" className="btn-ghost shrink-0">
            View all →
          </Link>
        </div>
        <TrendingTasks />
      </section>

      {/* How it works */}
      <section className="mt-24">
        <div className="text-center">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Four steps to your first <span className="text-rainbow">reward</span>
          </h2>
        </div>
        <div className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connecting line on desktop */}
          <div className="absolute left-[12%] right-[12%] top-9 hidden h-px bg-rainbow opacity-40 lg:block" />
          {STEPS.map((s, i) => (
            <div key={s.title} className="glow-card p-6 text-center">
              <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-black text-3xl ring-1 ring-white/10">
                <span className="absolute -inset-px -z-10 rounded-2xl bg-rainbow opacity-60 blur-md" />
                {s.icon}
              </div>
              <div className="text-rainbow mt-5 font-mono text-xs font-bold">STEP {i + 1}</div>
              <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/55">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mt-24 overflow-hidden rounded-[2rem] border border-white/10 p-8 md:p-14">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(179,0,255,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(0,240,255,0.28),transparent_55%),radial-gradient(ellipse_at_center,rgba(255,138,0,0.12),transparent_60%)]" />
        <Image
          src="/logo-mark.png"
          alt=""
          width={340}
          height={340}
          className="pointer-events-none absolute -right-10 -top-10 -z-10 rotate-12 opacity-25 md:right-6 md:top-1/2 md:-translate-y-1/2"
        />
        <span className="eyebrow">For projects</span>
        <h2 className="mt-4 max-w-xl text-3xl font-bold md:text-5xl">Got a project to grow?</h2>
        <p className="mt-4 max-w-lg text-white/65">
          Set a budget, pick how many people, and publish. The 5% platform fee is included — no hidden costs.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/create" className="btn-primary px-6 py-3 text-base">
            Launch a campaign
          </Link>
          <Link href="/leaderboard" className="btn-ghost px-6 py-3 text-base">
            🏆 Leaderboard
          </Link>
        </div>
      </section>

      {/* Follow on X */}
      <section className="glass mt-10 flex flex-col items-center gap-4 p-8 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <h2 className="text-xl font-bold">Never miss a new task</h2>
          <p className="mt-1 text-sm text-white/55">New campaigns and updates are posted on X first.</p>
        </div>
        <a href={X_URL} target="_blank" rel="noreferrer noopener" className="btn-rainbow shrink-0 px-6 py-3">
          <span className="font-black">𝕏</span> Follow @{X_HANDLE}
        </a>
      </section>
    </>
  );
}
