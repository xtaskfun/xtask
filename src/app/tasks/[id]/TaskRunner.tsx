"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ACTION_META, Task, TaskAction } from "@/lib/tasks";

type Status = "todo" | "verifying" | "done";

export default function TaskRunner({ task }: { task: Task }) {
  const { isConnected } = useAccount();
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [claimed, setClaimed] = useState(false);

  const allDone = task.actions.every((a) => status[a] === "done");

  // TODO: replace with a real backend call that checks the X API.
  const verify = (a: TaskAction) => {
    setStatus((s) => ({ ...s, [a]: "verifying" }));
    setTimeout(() => setStatus((s) => ({ ...s, [a]: "done" })), 1200);
  };

  if (!isConnected) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-line p-6 text-center">
        <p className="mb-4 text-sm text-muted">Connect your wallet to start this task.</p>
        <div className="flex justify-center"><ConnectButton /></div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {task.actions.map((a, i) => {
        const st = status[a] ?? "todo";
        return (
          <div key={a} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-sm ${st === "done" ? "bg-accent text-black" : "bg-white/10"}`}>
                {st === "done" ? "✓" : i + 1}
              </span>
              <div>
                <div className="font-medium">{ACTION_META[a].icon} {ACTION_META[a].label}</div>
                <div className="text-xs text-muted">{task.creator}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={task.targetUrl} target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2">Go</a>
              <button className="btn-primary px-4 py-2" disabled={st !== "todo"} onClick={() => verify(a)}>
                {st === "verifying" ? "Checking…" : st === "done" ? "Done" : "Verify"}
              </button>
            </div>
          </div>
        );
      })}

      <button className="btn-primary mt-2 w-full py-3" disabled={!allDone || claimed} onClick={() => setClaimed(true)}>
        {claimed ? "🎉 Reward claimed" : `Claim ${task.rewardPerUser} ${task.token}`}
      </button>
    </div>
  );
}
