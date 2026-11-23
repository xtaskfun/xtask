import { notFound } from "next/navigation";
import Link from "next/link";
import TaskRunner from "./TaskRunner";
import { ActionPills, Progress } from "@/components/TaskCard";
import { TASKS, daysLeft, getTask } from "@/lib/tasks";

export function generateStaticParams() {
  return TASKS.map((t) => ({ id: t.id }));
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) notFound();

  return (
    <div className="py-10">
      <Link href="/tasks" className="text-sm text-muted hover:text-white">← Back to tasks</Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs text-brand">{task.category}</span>
            by {task.creator}
          </div>
          <h1 className="mt-3 text-2xl font-bold md:text-3xl">{task.title}</h1>
          <p className="mt-3 text-muted">{task.description}</p>
          <div className="mt-5"><ActionPills actions={task.actions} /></div>

          <h2 className="mt-8 font-semibold">Steps</h2>
          <TaskRunner task={task} />
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-line bg-card p-6">
          <div>
            <div className="text-sm text-muted">Reward per user</div>
            <div className="text-3xl font-black text-accent">{task.rewardPerUser} {task.token}</div>
          </div>
          <Progress value={task.filled} max={task.slots} />
          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Total pool</dt><dd>{(task.rewardPerUser * task.slots).toLocaleString()} {task.token}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Ends in</dt><dd>{daysLeft(task.endsAt)} days</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Target</dt><dd><a href={task.targetUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">Open on X ↗</a></dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
