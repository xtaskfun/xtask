import Link from "next/link";
import { ACTION_META, Task, daysLeft } from "@/lib/tasks";

export function ActionPills({ actions }: { actions: Task["actions"] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <span key={a} className="rounded-full border border-line bg-white/5 px-2.5 py-1 text-xs">
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
        <div className="h-full rounded-full bg-rainbow" style={{ width: `${pct}%` }} />
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
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-white/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
            {task.creator.slice(1, 3).toUpperCase()}
          </span>
          {task.creator}
        </div>
        <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs text-brand">{task.category}</span>
      </div>

      <div>
        <h3 className="font-semibold">{task.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{task.description}</p>
      </div>

      <ActionPills actions={task.actions} />

      <Progress value={task.filled} max={task.slots} />

      <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
        <div>
          <div className="text-xs text-muted">Reward</div>
          <div className="font-bold text-accent">
            {task.rewardPerUser} {task.token}
          </div>
        </div>
        <span className={`text-xs ${full ? "text-red-400" : "text-muted"}`}>
          {full ? "Full" : `${daysLeft(task.endsAt)}d left`}
        </span>
      </div>
    </Link>
  );
}
