"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BaseError } from "viem";
import { ACTION_META, Task, TaskAction } from "@/lib/tasks";
import { ESCROW_ADDRESS, ESCROW_CHAIN_ID, escrowAbi } from "@/lib/escrow";

type Status = "todo" | "verifying" | "done";

export function errMsg(e: unknown) {
  if (e instanceof BaseError) return e.shortMessage;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

export default function TaskRunner({ task, isDemo, onChange }: { task: Task; isDemo: boolean; onChange: () => void }) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: ESCROW_CHAIN_ID });

  const [status, setStatus] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState<"claim" | "refund" | null>(null);
  const [error, setError] = useState("");
  const [demoClaimed, setDemoClaimed] = useState(false);

  const onchain = task.onchain;
  const claimedQ = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "hasClaimed",
    args: [BigInt(task.id), address!],
    chainId: ESCROW_CHAIN_ID,
    query: { enabled: !!onchain && !!address },
  });

  const claimed = onchain ? !!claimedQ.data : demoClaimed;
  const full = task.filled >= task.slots;
  const ended = !!onchain?.ended;
  const isCreator = !!onchain && !!address && onchain.creator.toLowerCase() === address.toLowerCase();
  const allDone = task.actions.every((a) => status[a] === "done");

  // Marks the step as done in the UI; the real check happens on the server when claiming.
  const verify = (a: TaskAction) => {
    setStatus((s) => ({ ...s, [a]: "verifying" }));
    setTimeout(() => setStatus((s) => ({ ...s, [a]: "done" })), 1200);
  };

  async function ensureChain() {
    if (chainId !== ESCROW_CHAIN_ID) await switchChainAsync({ chainId: ESCROW_CHAIN_ID });
  }

  async function claim() {
    if (!onchain) return setDemoClaimed(true);
    setError("");
    setBusy("claim");
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, user: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim refused");

      await ensureChain();
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS!,
        abi: escrowAbi,
        functionName: "claim",
        args: [BigInt(task.id), BigInt(data.deadline), data.signature],
        chainId: ESCROW_CHAIN_ID,
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      await claimedQ.refetch();
      onChange();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function refund() {
    setError("");
    setBusy("refund");
    try {
      await ensureChain();
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS!,
        abi: escrowAbi,
        functionName: "refund",
        args: [BigInt(task.id)],
        chainId: ESCROW_CHAIN_ID,
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      onChange();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  if (!isConnected) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-line p-6 text-center">
        <p className="mb-4 text-sm text-muted">Connect your wallet to start this task.</p>
        <div className="flex justify-center"><ConnectButton /></div>
      </div>
    );
  }

  if (isCreator) {
    const unclaimed = task.rewardPerUser * (task.slots - task.filled);
    return (
      <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm">
        <p>You created this task. {task.filled} of {task.slots} slots claimed.</p>
        {onchain!.refunded ? (
          <p className="text-muted">Unclaimed rewards were refunded to you.</p>
        ) : ended ? (
          <button className="btn-primary w-full py-3" disabled={!!busy} onClick={refund}>
            {busy === "refund" ? "Refunding…" : `Refund ${unclaimed.toLocaleString()} ${task.token}`}
          </button>
        ) : (
          <p className="text-muted">After the task ends you can refund the unclaimed slots here.</p>
        )}
        {error && <p className="text-red-400">{error}</p>}
      </div>
    );
  }

  const claimLabel = claimed
    ? "🎉 Reward claimed"
    : busy === "claim"
      ? "Claiming…"
      : full
        ? "Task is full"
        : ended
          ? "Task has ended"
          : `Claim ${task.rewardPerUser.toLocaleString()} ${task.token}`;

  return (
    <div className="mt-4 space-y-3">
      {task.actions.map((a, i) => {
        const st = claimed ? "done" : (status[a] ?? "todo");
        return (
          <div key={a} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-sm ${st === "done" ? "bg-rainbow font-bold text-black" : "bg-white/10"}`}>
                {st === "done" ? "✓" : i + 1}
              </span>
              <div>
                <div className="font-medium">{ACTION_META[a].icon} {ACTION_META[a].label}</div>
                <div className="text-xs text-muted">{task.creator}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={task.targetUrl} target="_blank" rel="noreferrer noopener" className="btn-ghost px-4 py-2">Go</a>
              <button className="btn-primary px-4 py-2" disabled={st !== "todo" || ended || full} onClick={() => verify(a)}>
                {st === "verifying" ? "Checking…" : st === "done" ? "Done" : "Verify"}
              </button>
            </div>
          </div>
        );
      })}

      <button
        className="btn-primary mt-2 w-full py-3"
        disabled={!allDone || claimed || full || ended || !!busy}
        onClick={claim}
      >
        {claimLabel}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {isDemo && <p className="text-xs text-muted">Demo mode — nothing is paid out.</p>}
    </div>
  );
}
