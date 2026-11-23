"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, usePublicClient, useReadContracts, useSwitchChain, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { erc20Abi, formatUnits, parseEventLogs, parseUnits, zeroAddress } from "viem";
import TaskCard from "@/components/TaskCard";
import { errMsg } from "@/app/tasks/[id]/TaskRunner";
import { ACTION_META, CATEGORIES, Category, Task, TaskAction, TaskMeta, autoTitle } from "@/lib/tasks";
import { ESCROWS, MAX_SLOTS, escrowAbi, taskKey } from "@/lib/escrow";
import { base } from "@/lib/chains";
import { TOKENS, type Token } from "@/lib/tokens";
import { parseTarget, targetSupports } from "@/lib/x/target";

const MAX_META_BYTES = 1024;
/** Every task runs this long; after that the creator can refund unclaimed slots. */
const TASK_DURATION_DAYS = 30;

/**
 * Reads symbol() and decimals() of every listed ERC20 on its chain and keeps only the
 * tokens whose on-chain values match our list — protects creators from a wrong address.
 */
function useVerifiedTokens(chainId: number) {
  const listed = TOKENS[chainId] ?? [];
  const erc20s = listed.filter((t) => t.address !== zeroAddress);
  const q = useReadContracts({
    contracts: erc20s.flatMap((t) => [
      { address: t.address, abi: erc20Abi, functionName: "symbol" as const, chainId },
      { address: t.address, abi: erc20Abi, functionName: "decimals" as const, chainId },
    ]),
    query: { staleTime: 10 * 60_000 },
  });
  return useMemo(() => {
    const ok = new Set<string>();
    erc20s.forEach((t, i) => {
      const sym = q.data?.[i * 2];
      const dec = q.data?.[i * 2 + 1];
      if (sym?.status === "success" && dec?.status === "success" && sym.result === t.symbol && dec.result === t.decimals) ok.add(t.symbol);
    });
    const tokens: (Token & { available: boolean })[] = listed.map((t) => ({
      ...t,
      available: t.address === zeroAddress || ok.has(t.symbol),
    }));
    return { tokens, checking: q.isLoading };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, q.isLoading, chainId]);
}

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  // Network: one of the deployed escrows, or Base for the demo.
  const [netId, setNetId] = useState<number>(ESCROWS[0]?.chain.id ?? base.id);
  const escrow = ESCROWS.find((e) => e.chain.id === netId);
  const netName = escrow?.chain.name ?? "Base";
  const publicClient = usePublicClient({ chainId: netId });
  const { tokens, checking } = useVerifiedTokens(netId);

  const [form, setForm] = useState({
    handle: "",
    targetUrl: "",
    actions: ["follow", "like"] as TaskAction[],
    token: "USDC",
    reward: "1",
    slots: "100",
    category: "Project" as Category,
  });
  const [step, setStep] = useState<"" | "switch" | "approve" | "create" | "confirm" | "done">("");
  const [error, setError] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleAction = (a: TaskAction) =>
    set("actions", form.actions.includes(a) ? form.actions.filter((x) => x !== a) : [...form.actions, a]);

  const available = tokens.filter((t) => t.available);
  const token = available.find((t) => t.symbol === form.token) ?? available[0];
  const tokenSymbol = token?.symbol ?? form.token;

  // The creator picks the reward per person and how many people; the deposit is reward x slots.
  const decimals = token?.decimals ?? 18;
  const rewardRaw = useMemo(() => {
    try {
      return parseUnits(form.reward || "0", decimals);
    } catch {
      return 0n;
    }
  }, [form.reward, decimals]);
  const slots = Math.floor(Number(form.slots) || 0);
  const slotsOk = slots >= 1 && slots <= MAX_SLOTS;
  const amount = slotsOk ? rewardRaw * BigInt(slots) : 0n;
  const poolNum = Number(formatUnits(amount, decimals));
  const perUser = Number(formatUnits(rewardRaw, decimals));

  const meta: TaskMeta = {
    // Title is generated from the actions + X account; no description needed.
    title: autoTitle(form.actions, form.targetUrl.trim()),
    description: "",
    targetUrl: form.targetUrl.trim(),
    actions: form.actions,
    category: form.category,
    // Empty handle → use the account from the link
    handle: form.handle.replace(/^@/, "").trim() || (parseTarget(form.targetUrl.trim())?.handle ?? ""),
  };
  const metaJson = JSON.stringify(meta);
  const metaTooLong = new TextEncoder().encode(metaJson).length > MAX_META_BYTES;

  const target = parseTarget(meta.targetUrl);
  const urlError = !meta.targetUrl
    ? ""
    : !target
      ? "Use an X link like https://x.com/yourproject or https://x.com/yourproject/status/123…"
      : !targetSupports(target, form.actions)
        ? "Like, repost, reply and quote need a link to a specific post (…/status/…)."
        : "";

  const valid = target && !urlError && form.actions.length && rewardRaw > 0n && slotsOk && !metaTooLong;

  const preview: Task = {
    id: "preview",
    title: meta.title || "Your task title",
    description: "",
    creator: meta.handle ? `@${meta.handle}` : "@you",
    actions: form.actions,
    targetUrl: meta.targetUrl,
    rewardPerUser: perUser,
    token: tokenSymbol,
    slots: slotsOk ? slots : 0,
    filled: 0,
    endsAt: new Date(Date.now() + TASK_DURATION_DAYS * 86_400_000).toISOString(),
    category: form.category,
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!escrow) return setStep("done"); // demo mode
    if (!token || !address || !publicClient) return;
    const ESCROW_ADDRESS = escrow.address;
    const ESCROW_CHAIN_ID = escrow.chain.id;

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
      const endsAt = BigInt(Math.floor(Date.now() / 1000) + TASK_DURATION_DAYS * 86_400);
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: "createTask",
        args: [token.address, rewardRaw, slots, endsAt, metaJson],
        value: isNative ? amount : 0n,
        chainId: ESCROW_CHAIN_ID,
      });
      setStep("confirm");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const [created] = parseEventLogs({ abi: escrowAbi, logs: receipt.logs, eventName: "TaskCreated" });
      setStep("done");
      if (created) router.push(`/tasks/${taskKey(ESCROW_CHAIN_ID, created.args.taskId)}`);
    } catch (err) {
      setError(errMsg(err));
      setStep("");
    }
  }

  const busy = step !== "" && step !== "done";
  const buttonLabel = {
    "": `Deposit ${poolNum.toLocaleString()} ${tokenSymbol} & publish`,
    switch: `Switching to ${netName}…`,
    approve: `Approving ${tokenSymbol}…`,
    create: "Confirm in wallet…",
    confirm: "Publishing…",
    done: "✅ Task published",
  }[step];

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold">Create a task</h1>
      <p className="mt-1 text-muted">
        Set the reward per person and how many people can claim it. You deposit the total up front.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form className="space-y-6 rounded-2xl border border-line bg-card p-6" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Your X handle</label>
              <input className="input" maxLength={31} placeholder="@yourproject (optional — taken from the link)" value={form.handle} onChange={(e) => set("handle", e.target.value)} />
            </div>
            <div>
              <label className="label">Tweet / profile URL</label>
              <input className="input" maxLength={200} placeholder="https://x.com/yourproject/status/…" value={form.targetUrl} onChange={(e) => set("targetUrl", e.target.value)} />
            </div>
            {urlError && <p className="text-sm text-red-400 sm:col-span-2">{urlError}</p>}
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

          {ESCROWS.length > 1 && (
            <div>
              <label className="label">Network</label>
              <div className="grid grid-cols-2 gap-2">
                {ESCROWS.map((e) => (
                  <button
                    type="button"
                    key={e.chain.id}
                    onClick={() => setNetId(e.chain.id)}
                    className={`rounded-xl border p-3 text-sm transition ${netId === e.chain.id ? "border-rainbow text-white" : "border-line text-muted hover:text-white"}`}
                  >
                    {e.chain.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => set("category", e.target.value as Category)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Reward token</label>
              <select className="input" value={tokenSymbol} onChange={(e) => set("token", e.target.value)}>
                {tokens.map((t) => (
                  <option key={t.symbol} value={t.symbol} disabled={!t.available}>
                    {t.symbol}
                    {!t.available && !checking ? " (unavailable)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reward per person</label>
              <div className="relative">
                <input type="number" min={0} step="any" className="input pr-16" value={form.reward} onChange={(e) => set("reward", e.target.value)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">{tokenSymbol}</span>
              </div>
            </div>
            <div>
              <label className="label">Number of people</label>
              <input type="number" min={1} max={MAX_SLOTS} step={1} className="input" value={form.slots} onChange={(e) => set("slots", e.target.value)} />
              {!slotsOk && form.slots !== "" && <p className="mt-1 text-xs text-red-400">Between 1 and {MAX_SLOTS.toLocaleString()}.</p>}
            </div>
          </div>

          <div className="space-y-2 rounded-xl bg-surface p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">Reward per person</span><span>{perUser.toLocaleString()} {tokenSymbol}</span></div>
            <div className="flex justify-between"><span className="text-muted">People</span><span>× {slotsOk ? slots.toLocaleString() : "–"}</span></div>
            <div className="flex justify-between border-t border-line pt-2 font-semibold"><span>You deposit</span><span className="text-rainbow">{poolNum.toLocaleString()} {tokenSymbol}</span></div>
            <p className="pt-1 text-xs text-muted">
              Funds are held by the escrow smart contract, not by xtask. The task runs for {TASK_DURATION_DAYS} days; slots nobody claimed are refundable to you after that.
            </p>
          </div>

          {metaTooLong && <p className="text-sm text-red-400">The link or handle is too long.</p>}
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
          {!escrow && <p className="text-center text-xs text-muted">Demo mode — the escrow contract isn&apos;t connected yet, nothing will be charged.</p>}
        </form>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-3 text-sm text-muted">Live preview</div>
          <div className="pointer-events-none"><TaskCard task={preview} /></div>
        </div>
      </div>
    </div>
  );
}
