"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import TaskCard from "@/components/TaskCard";
import { ACTION_META, Task, TaskAction } from "@/lib/tasks";

const TOKENS = ["USDC", "USDT", "ETH", "BNB", "ARB", "PEPE"];
const CATEGORIES: Task["category"][] = ["Project", "Meme", "NFT", "DeFi", "Community"];
const PLATFORM_FEE = 0.05; // 5%

export default function CreatePage() {
  const { isConnected } = useAccount();
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetUrl: "",
    actions: ["follow", "like"] as TaskAction[],
    token: "USDC",
    rewardPerUser: 1,
    slots: 100,
    days: 7,
    category: "Project" as Task["category"],
  });
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleAction = (a: TaskAction) =>
    set("actions", form.actions.includes(a) ? form.actions.filter((x) => x !== a) : [...form.actions, a]);

  const pool = form.rewardPerUser * form.slots;
  const fee = pool * PLATFORM_FEE;
  const valid = form.title && form.targetUrl.startsWith("http") && form.actions.length && pool > 0;

  const preview: Task = {
    id: "preview",
    title: form.title || "Your task title",
    description: form.description || "Describe what users need to do.",
    creator: "@you",
    actions: form.actions,
    targetUrl: form.targetUrl,
    rewardPerUser: form.rewardPerUser,
    token: form.token,
    slots: form.slots,
    filled: 0,
    endsAt: new Date(Date.now() + form.days * 86_400_000).toISOString(),
    category: form.category,
  };

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold">Create a task</h1>
      <p className="mt-1 text-muted">Fund a campaign and get real engagement on X.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          className="space-y-6 rounded-2xl border border-line bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: approve token + call escrow contract, then POST to backend.
            setSubmitted(true);
          }}
        >
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. Follow & repost our launch" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-24" placeholder="Explain what users should do" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <label className="label">Tweet / profile URL</label>
            <input className="input" placeholder="https://x.com/yourproject/status/…" value={form.targetUrl} onChange={(e) => set("targetUrl", e.target.value)} />
          </div>

          <div>
            <label className="label">Required actions</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(Object.keys(ACTION_META) as TaskAction[]).map((a) => {
                const on = form.actions.includes(a);
                return (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAction(a)}
                    className={`rounded-xl border p-3 text-sm transition ${on ? "border-rainbow text-white" : "border-line text-muted hover:text-white"}`}
                  >
                    <div className="text-xl">{ACTION_META[a].icon}</div>
                    {ACTION_META[a].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => set("category", e.target.value as Task["category"])}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Reward token</label>
              <select className="input" value={form.token} onChange={(e) => set("token", e.target.value)}>
                {TOKENS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Reward per user</label>
              <input type="number" min={0} step="any" className="input" value={form.rewardPerUser} onChange={(e) => set("rewardPerUser", Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Number of slots</label>
              <input type="number" min={1} className="input" value={form.slots} onChange={(e) => set("slots", Number(e.target.value))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Duration: {form.days} days</label>
              <input type="range" min={1} max={30} value={form.days} onChange={(e) => set("days", Number(e.target.value))} className="w-full accent-white" />
            </div>
          </div>

          <div className="space-y-2 rounded-xl bg-surface p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">Reward pool</span><span>{pool.toLocaleString()} {form.token}</span></div>
            <div className="flex justify-between"><span className="text-muted">Platform fee (5%)</span><span>{fee.toLocaleString()} {form.token}</span></div>
            <div className="flex justify-between border-t border-line pt-2 font-semibold"><span>Total</span><span className="text-accent">{(pool + fee).toLocaleString()} {form.token}</span></div>
          </div>

          {isConnected ? (
            <button type="submit" className="btn-primary w-full py-3" disabled={!valid || submitted}>
              {submitted ? "✅ Task submitted" : "Fund & publish task"}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line p-5">
              <p className="text-sm text-muted">Connect a wallet to fund this task.</p>
              <ConnectButton />
            </div>
          )}
        </form>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-3 text-sm text-muted">Live preview</div>
          <div className="pointer-events-none"><TaskCard task={preview} /></div>
        </div>
      </div>
    </div>
  );
}
