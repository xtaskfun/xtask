"use client";

import TaskCard from "./TaskCard";
import { useTasks } from "@/lib/useTasks";
import type { Task } from "@/lib/tasks";

export function DemoBanner() {
  return (
    <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-muted">
      Demo data — the escrow contract isn&apos;t connected yet.
    </div>
  );
}

export function Grid({ tasks, isLoading }: { tasks: Task[]; isLoading?: boolean }) {
  if (isLoading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse glass" />)}
      </div>
    );
  if (!tasks.length)
    return (
      <div className="rounded-2xl border border-dashed border-line p-12 text-center text-muted">
        No tasks yet.
      </div>
    );
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
    </div>
  );
}

/** Top open tasks by reward, for the home page. */
export default function TrendingTasks() {
  const { tasks, isLoading } = useTasks();
  const open = tasks
    .filter((t) => !t.onchain?.ended && t.filled < t.slots)
    .sort((a, b) => b.filled / b.slots - a.filled / a.slots)
    .slice(0, 3);
  return <Grid tasks={open} isLoading={isLoading} />;
}
