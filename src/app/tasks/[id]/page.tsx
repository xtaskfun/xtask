"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import TaskRunner from "./TaskRunner";
import { ActionPills, Progress } from "@/components/TaskCard";
import { DemoBanner } from "@/components/TaskGrid";
import { daysLeft } from "@/lib/tasks";
import { useTask } from "@/lib/useTasks";
import { ESCROW_CHAINS, explorerUrl } from "@/lib/chains";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { task, isDemo, isLoading, refetch } = useTask(id);

  if (isLoading) return <div className="py-32 text-center text-muted">Loading task…</div>;
  if (!task)
    return (
      <div className="py-32 text-center">
        <h1 className="text-2xl font-bold">Task not found</h1>
        <Link href="/tasks" className="btn-primary mt-6">Browse tasks</Link>
      </div>
    );

  const ended = task.onchain?.ended;
  const pool = task.rewardPerUser * task.slots;

  return (
    <div className="py-10">
      <Link href="/tasks" className="text-sm text-muted hover:text-white">← Back to tasks</Link>
      {isDemo && <DemoBanner />}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="glass p-6">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs text-brand">{task.category}</span>
            by {task.creator}
          </div>
          <h1 className="mt-3 text-2xl font-bold md:text-3xl">{task.title}</h1>
          {task.description && <p className="mt-3 whitespace-pre-line text-muted">{task.description}</p>}
          <div className="mt-5"><ActionPills actions={task.actions} /></div>

          <h2 className="mt-8 font-semibold">Steps</h2>
          <TaskRunner task={task} isDemo={isDemo} onChange={() => refetch()} />
        </div>

        <aside className="h-fit space-y-4 glass p-6">
          <div>
            <div className="text-sm text-muted">Your reward</div>
            <div className="text-rainbow text-3xl font-black">{task.rewardPerUser.toLocaleString()} {task.token}</div>
          </div>
          <Progress value={task.filled} max={task.slots} />
          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            {task.onchain && (
              <div className="flex justify-between">
                <dt className="text-muted">Network</dt>
                <dd>
                  <a className="hover:underline" href={`${explorerUrl(task.onchain.chainId)}/address/${task.onchain.escrow}`} target="_blank" rel="noreferrer noopener">
                    {ESCROW_CHAINS.find((c) => c.id === task.onchain!.chainId)?.name ?? task.onchain.chainId} ↗
                  </a>
                </dd>
              </div>
            )}
            <div className="flex justify-between"><dt className="text-muted">Total pool</dt><dd>{pool.toLocaleString()} {task.token}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Ends in</dt><dd>{ended ? "Ended" : `${daysLeft(task.endsAt)} days`}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Target</dt><dd><a href={task.targetUrl} target="_blank" rel="noreferrer noopener" className="text-brand hover:underline">Open on X ↗</a></dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
