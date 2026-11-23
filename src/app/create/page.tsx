"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { erc20Abi, formatUnits, parseEventLogs, parseUnits, zeroAddress } from "viem";
import TaskCard from "@/components/TaskCard";
import { errMsg } from "@/app/tasks/[id]/TaskRunner";
import { ACTION_META, CATEGORIES, Category, Task, TaskAction, TaskMeta } from "@/lib/tasks";
import { ESCROW_ADDRESS, ESCROW_CHAIN, ESCROW_CHAIN_ID, SLOTS, escrowAbi } from "@/lib/escrow";
import { TOKENS } from "@/lib/tokens";

const MAX_META_BYTES = 1024;
const tokens = TOKENS[ESCROW_CHAIN_ID] ?? [];

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: ESCROW_CHAIN_ID });

  const [form, setForm] = useState({
    title: "",
    description: "",
    handle: "",
    targetUrl: "",
    actions: ["follow", "like"] as TaskAction[],
    token: tokens[0]?.symbol ?? "USDC",
    pool: "100",
    days: 7,
    category: "Project" as Category,
  });
  const [step, setStep] = useState<"" | "switch" | "approve" | "create" | "confirm" | "done">("");
  const [error, setError] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleAction = (a: TaskAction) =>
    set("actions", form.actions.includes(a) ? form.actions.filter((x) => x !== a) : [...form.actions, a]);

  const token = tokens.find((t) => t.symbol === form.token) ?? tokens[0];

  // Pool in base units, rounded down so it splits into exactly 100 equal slots.
  const amount = useMemo(() => {
    try {
      const raw = parseUnits(form.pool || "0", token?.decimals ?? 18);
      return raw - (raw % BigInt(SLOTS));
    } catch {
      return 0n;
    }
  }, [form.pool, token]);
  const poolNum = Number(formatUnits(amount, token?.decimals ?? 18));
  const perUser = Number(formatUnits(amount / BigInt(SLOTS), token?.decimals ?? 18));

  const meta: TaskMeta = {
    title: form.title.trim(),
    description: form.description.trim(),
    targetUrl: form.targetUrl.trim(),
    actions: form.actions,
    category: form.category,
    handle: form.handle.replace(/^@/, "").trim(),
  };
  const metaJson = JSON.stringify(meta);
  const metaTooLong = new TextEncoder().encode(metaJson).length > MAX_META_BYTES;

  const valid =
    meta.title && /^https?:\/\/(x|twitter)\.com\//i.test(meta.targetUrl) && form.actions.length && amount > 0n && !metaTooLong;

  const preview: Task = {
    id: "preview",
    title: meta.title || "Your task title",
    description: meta.description || "Describe what users need to do.",
    creator: meta.handle ? `@${meta.handle}` : "@you",
    actions: form.actions,
    targetUrl: meta.targetUrl,
    rewardPerUser: perUser,
    token: form.token,
    slots: SLOTS,
    filled: 0,
    endsAt: new Date(Date.now() + form.days * 86_400_000).toISOString(),
    category: form.category,
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!ESCROW_ADDRESS) return setStep("done"); // demo mode
    if (!token || !address || !publicClient) return;

    try {
      if (chainId !== ESCROW_CHAIN_ID) {
        setStep("switch");
        await switchChainAsync({ chainId: ESCROW_CHAIN_ID });
      }

      const isNative = token.address === zeroAddress;
      if (!isNative) {
        const allowance = await publicClient.readContract({
          address: token.address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, ESCROW_ADDRESS],
        });
        if (allowance < amount) {
          setStep("approve");
          const h = await writeContractAsync({
            address: token.address,
            abi: erc20Abi,
            functionName: "approve",
            args: [ESCROW_ADDRESS, amount],
            chainId: ESCROW_CHAIN_ID,
          });
          await publicClient.waitForTransactionReceipt({ hash: h });
        }
      }

      setStep("create");
      const endsAt = BigInt(Math.floor(Date.now() / 1000) + form.days * 86_400);
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: "createTask",
        args: [token.address, amount, endsAt, metaJson],
        value: isNative ? amount : 0n,
        chainId: ESCROW_CHAIN_ID,
      });
      setStep("confirm");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const [created] = parseEventLogs({ abi: escrowAbi, logs: receipt.logs, eventName: "TaskCreated" });
      setStep("done");
      if (created) router.push(`/tasks/${created.args.taskId}`);
    } catch (err) {
      setError(errMsg(err));
      setStep("");
    }
  }

  const busy = step !== "" && step !== "done";
  const buttonLabel = {
    "": `Deposit ${poolNum.toLocaleString()} ${form.token} & publish`,
    switch: `Switching to ${ESCROW_CHAIN.name}…`,
    approve: `Approving ${form.token}…`,
    create: "Confirm in wallet…",
    confirm: "Publishing…",
    done: "✅ Task published",
  }[step];

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold">Create a task</h1>
      <p className="mt-1 text-muted">
        Deposit a reward pool. {SLOTS} people can complete your task and each claims 1% of the pool.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form className="space-y-6 rounded-2xl border border-line bg-card p-6" onSubmit={submit}>
          <div>
            <label className="label">Title</label>
            <input className="input" maxLength={100} placeholder="e.g. Follow & repost our launch" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-24" maxLength={500} placeholder="Explain what users should do" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Your X handle</label>
              <input className="input" maxLength={31} placeholder="@yourproject" value={form.handle} onChange={(e) => set("handle", e.target.value)} />
            </div>
            <div>
              <label className="label">Tweet / profile URL</label>
              <input className="input" maxLength={200} placeholder="https://x.com/yourproject/status/…" value={form.targetUrl} onChange={(e) => set("targetUrl", e.target.value)} />
            </div>
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
              <select className="input" value={form.category} onChange={(e) => set("category", e.target.value as Category)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Reward token ({ESCROW_CHAIN.name})</label>
              <select className="input" value={form.token} onChange={(e) => set("token", e.target.value)}>
                {tokens.map((t) => <option key={t.symbol}>{t.symbol}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Total reward pool</label>
              <div className="relative">
                <input type="number" min={0} step="any" className="input pr-16" value={form.pool} onChange={(e) => set("pool", e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">{form.token}</span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Duration: {form.days} days</label>
              <input type="range" min={1} max={30} value={form.days} onChange={(e) => set("days", Number(e.target.value))} className="w-full accent-white" />
            </div>
          </div>

          <div className="space-y-2 rounded-xl bg-surface p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">Slots</span><span>{SLOTS} people</span></div>
            <div className="flex justify-between"><span className="text-muted">Reward per person (1%)</span><span>{perUser.toLocaleString()} {form.token}</span></div>
            <div className="flex justify-between border-t border-line pt-2 font-semibold"><span>You deposit</span><span className="text-rainbow">{poolNum.toLocaleString()} {form.token}</span></div>
            <p className="pt-1 text-xs text-muted">
              Funds are held by the escrow smart contract, not by xtask. Slots nobody claimed are refundable to you after the task ends.
            </p>
          </div>

          {metaTooLong && <p className="text-sm text-red-400">Title + description are too long.</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {isConnected ? (
            <button type="submit" className="btn-primary w-full py-3" disabled={!valid || busy || step === "done"}>
              {buttonLabel}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line p-5">
              <p className="text-sm text-muted">Connect a wallet to fund this task.</p>
              <ConnectButton />
            </div>
          )}
          {!ESCROW_ADDRESS && <p className="text-center text-xs text-muted">Demo mode — the escrow contract isn&apos;t connected yet, nothing will be charged.</p>}
        </form>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-3 text-sm text-muted">Live preview</div>
          <div className="pointer-events-none"><TaskCard task={preview} /></div>
        </div>
      </div>
    </div>
  );
}
