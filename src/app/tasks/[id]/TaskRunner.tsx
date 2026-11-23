"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import ConnectWallet from "@/components/ConnectWallet";
import { confetti } from "@/lib/confetti";
import { BaseError } from "viem";
import { ACTION_META, Task, TaskAction } from "@/lib/tasks";
import { escrowAbi } from "@/lib/escrow";
import { useXSession } from "@/lib/useXSession";
import { XConnectButton } from "@/components/XConnect";
import { SITE_URL, VERIFICATION_MODE, X_HANDLE } from "@/lib/site";

const CHECK_ON_X = VERIFICATION_MODE === "x";

/** X "post" intent: opens X with the text pre-filled (no API needed). */
export function shareOnX(text: string, url: string) {
  return `https://x.com/intent/post?${new URLSearchParams({ text, url }).toString()}`;
}

function ShareButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="btn-rainbow w-full py-3">
      <span className="font-black">𝕏</span> {label}
    </a>
  );
}

type Status = "todo" | "waiting" | "done" | "missing";

/** Without X verification: after "Go", give the user time to do the action on X. */
const WAIT_SECONDS = 10;

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" aria-hidden />;
}

export function errMsg(e: unknown) {
  if (e instanceof BaseError) return e.shortMessage;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

export default function TaskRunner({ task, isDemo, onChange }: { task: Task; isDemo: boolean; onChange: () => void }) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const x = useXSession();
  const [status, setStatus] = useState<Record<string, Status>>({});
  // When each waiting step finishes (ms timestamp), and a ticking clock for the countdown.
  const [waitUntil, setWaitUntil] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const waiting = Object.keys(waitUntil).length > 0;
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const finished = Object.entries(waitUntil).filter(([, until]) => until <= n).map(([a]) => a);
      if (finished.length) {
        setStatus((s) => ({ ...s, ...Object.fromEntries(finished.map((a) => [a, "done" as Status])) }));
        setWaitUntil((w) => Object.fromEntries(Object.entries(w).filter(([a]) => !finished.includes(a))));
      }
    }, 250);
    return () => clearInterval(t);
  }, [waiting, waitUntil]);

  const startWaiting = (a: TaskAction) => {
    if (CHECK_ON_X || status[a] === "done" || waitUntil[a]) return;
    setNow(Date.now());
    setStatus((s) => ({ ...s, [a]: "waiting" }));
    setWaitUntil((w) => ({ ...w, [a]: Date.now() + WAIT_SECONDS * 1000 }));
  };
  const [busy, setBusy] = useState<"verify" | "claim" | "refund" | null>(null);
  const [error, setError] = useState("");
  const [demoClaimed, setDemoClaimed] = useState(false);

  const onchain = task.onchain;
  const taskChainId = onchain?.chainId;
  const publicClient = usePublicClient({ chainId: taskChainId });
  const claimedQ = useReadContract({
    address: onchain?.escrow,
    abi: escrowAbi,
    functionName: "hasClaimed",
    args: [onchain?.taskId ?? 0n, address!],
    chainId: taskChainId,
    query: { enabled: !!onchain && !!address },
  });

  const claimed = onchain ? !!claimedQ.data : demoClaimed;
  const full = task.filled >= task.slots;
  const ended = !!onchain?.ended;
  const isCreator = !!onchain && !!address && onchain.creator.toLowerCase() === address.toLowerCase();
  const allDone = task.actions.every((a) => status[a] === "done");

  // Asks the server to check every action on X. The claim re-checks server-side.
  async function verify() {
    setError("");
    setBusy("verify");
    try {
      if (!onchain) {
        await new Promise((r) => setTimeout(r, 900)); // demo
        setStatus(Object.fromEntries(task.actions.map((a) => [a, "done"])));
        return;
      }
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      const data = await res.json();
      if (res.status === 401) x.refetch();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      const actions = data.actions as Partial<Record<TaskAction, boolean>>;
      setStatus(Object.fromEntries(task.actions.map((a) => [a, actions[a] ? "done" : "missing"])));
      if (!data.ok) setError("Some actions weren't found on X yet. Finish them, wait a moment and check again.");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function ensureChain() {
    if (taskChainId && chainId !== taskChainId) await switchChainAsync({ chainId: taskChainId });
  }

  async function claim() {
    if (!onchain) {
      setDemoClaimed(true);
      confetti();
      return;
    }
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
        address: onchain.escrow,
        abi: escrowAbi,
        functionName: "claim",
        args: [onchain.taskId, BigInt(data.deadline), data.signature],
        chainId: onchain.chainId,
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      await claimedQ.refetch();
      confetti();
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
        address: onchain!.escrow,
        abi: escrowAbi,
        functionName: "refund",
        args: [onchain!.taskId],
        chainId: onchain!.chainId,
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
        <div className="flex justify-center"><ConnectWallet /></div>
      </div>
    );
  }

  if (isCreator) {
    const unclaimed = task.rewardPerUser * (task.slots - task.filled);
    return (
      <div className="mt-4 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 text-sm">
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
        {!ended && (
          <ShareButton
            label="Share your task on X"
            href={shareOnX(
              `New task on @${X_HANDLE} 🌈\n\n${task.title} and earn ${task.rewardPerUser.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${task.token}. ${task.slots - task.filled} spots left 👇`,
              `${SITE_URL}/tasks/${task.id}`
            )}
          />
        )}
        {error && <p className="text-red-400">{error}</p>}
      </div>
    );
  }

  const needX = CHECK_ON_X && !!onchain && !claimed && !x.user;

  const claimLabel = claimed
    ? "Reward claimed ✓"
    : busy === "claim"
      ? "Claiming…"
      : full
        ? "Task is full"
        : ended
          ? "Task has ended"
          : `Claim ${task.rewardPerUser.toLocaleString()} ${task.token}`;

  return (
    <div className="mt-4 space-y-3">
      {needX && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line p-5 text-center">
          <p className="text-sm text-muted">Connect your X account so we can check your actions.</p>
          {x.isLoading ? null : x.configured ? (
            <XConnectButton full />
          ) : (
            <p className="text-sm text-red-400">X login isn&apos;t set up on this server yet.</p>
          )}
        </div>
      )}

      {task.actions.map((a, i) => {
        const st: Status = claimed ? "done" : (status[a] ?? "todo");
        return (
          <div key={a} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ${
                  st === "done" ? "bg-rainbow font-bold text-black" : st === "missing" ? "bg-red-500/20 text-red-400" : "bg-white/10"
                }`}
              >
                {st === "done" ? "✓" : st === "missing" ? "!" : st === "waiting" ? <Spinner /> : i + 1}
              </span>
              <div>
                <div className="font-medium">{ACTION_META[a].label}</div>
                <div className="text-xs text-muted">
                  {st === "missing"
                    ? "Not found on X yet"
                    : st === "waiting"
                      ? `Waiting for you to finish on X… ${Math.max(0, Math.ceil(((waitUntil[a] ?? now) - now) / 1000))}s`
                      : st === "done" && !CHECK_ON_X
                        ? "Done"
                        : task.creator}
                </div>
              </div>
            </div>
            <a
              href={task.targetUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-ghost px-4 py-2"
              // Without X verification, opening each step on X is what unlocks Claim.
              onClick={() => startWaiting(a)}
            >
              {st === "waiting" ? "Open again" : "Go"}
            </a>
          </div>
        );
      })}

      {!CHECK_ON_X && !allDone && !claimed && (
        <p className="text-center text-xs text-muted">Tap Go, complete the step on X, then come back — Claim unlocks when every step is done.</p>
      )}

      {CHECK_ON_X && !allDone && !claimed && (
        <button
          className="btn-rainbow mt-2 w-full py-3"
          disabled={!!busy || needX || ended || full}
          onClick={verify}
        >
          {busy === "verify" ? "Checking on X…" : "I did it — verify on X"}
        </button>
      )}

      <button
        className="btn-primary mt-2 w-full py-3"
        disabled={!allDone || claimed || full || ended || !!busy}
        onClick={claim}
      >
        {claimLabel}
      </button>
      {claimed && (
        <ShareButton
          label="Share on X"
          href={shareOnX(
            `I just earned ${task.rewardPerUser.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${task.token} on @${X_HANDLE} by completing a task 🌈\n\nEngage on X. Earn onchain 👇`,
            `${SITE_URL}/tasks/${task.id}`
          )}
        />
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {isDemo && <p className="text-xs text-muted">Demo mode — nothing is paid out.</p>}
    </div>
  );
}
