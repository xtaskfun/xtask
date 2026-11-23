import Link from "next/link";
import { ACTION_META, Task, daysLeft } from "@/lib/tasks";
import { ESCROW_CHAINS } from "@/lib/chains";
import XAvatar from "./XAvatar";

export function ActionPills({ actions }: { actions: Task["actions"] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <span key={a} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs">
          {ACTION_META[a].icon} {ACTION_META[a].label}
        </span>
      ))}
    </div>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-rainbow-loop bg-[length:200%_100%] animate-shimmer transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted">
        <span>{value.toLocaleString()} / {max.toLocaleString()} slots</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}

export default function TaskCard({ task }: { task: Task }) {
  const full = task.filled >= task.slots;
  const ended = task.onchain?.ended;
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="glow-card group flex flex-col gap-4 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          {task.creator.startsWith("@") ? (
            <XAvatar handle={task.creator} />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
              {task.creator.replace(/^0x/, "").slice(0, 2).toUpperCase()}
            </span>
          )}
          {task.creator}
        </div>
        <div className="flex gap-1.5">
          {task.onchain && (
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted">
              {ESCROW_CHAINS.find((c) => c.id === task.onchain!.chainId)?.name.replace(" Chain", "") ?? ""}
            </span>
          )}
          <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs text-brand">{task.category}</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold leading-snug">{task.title}</h3>
        {task.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{task.description}</p>}
      </div>

      <ActionPills actions={task.actions} />

      <Progress value={task.filled} max={task.slots} />

      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
        <div>
          <div className="text-xs text-muted">Reward</div>
          <div className="font-display text-xl font-bold text-accent">
            {task.rewardPerUser.toLocaleString("en-US", { maximumFractionDigits: 6 })} {task.token}
          </div>
        </div>
        {full || ended ? (
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400">{full ? "Full" : "Ended"}</span>
        ) : (
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition group-hover:scale-105">
            Earn → <span className="font-normal text-black/50">{daysLeft(task.endsAt)}d</span>
          </span>
        )}
      </div>
    </Link>
  );
}
