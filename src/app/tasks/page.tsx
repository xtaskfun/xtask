"use client";

import { useMemo, useState } from "react";
import { DemoBanner, Grid } from "@/components/TaskGrid";
import { ACTION_META, CATEGORIES as CATS, TaskAction } from "@/lib/tasks";
import { useTasks } from "@/lib/useTasks";

const CATEGORIES = ["All", ...CATS] as const;
const SORTS = { newest: "Newest", reward: "Highest reward", ending: "Ending soon" } as const;

export default function TasksPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [action, setAction] = useState<TaskAction | "all">("all");
  const [sort, setSort] = useState<keyof typeof SORTS>("newest");
  const { tasks, isDemo, isLoading } = useTasks();

  const list = useMemo(() => {
    let r = tasks.filter(
      (t) =>
        (cat === "All" || t.category === cat) &&
        (action === "all" || t.actions.includes(action)) &&
        (t.title + t.creator).toLowerCase().includes(q.toLowerCase())
    );
    if (sort === "reward") r = [...r].sort((a, b) => b.rewardPerUser - a.rewardPerUser);
    if (sort === "ending") r = [...r].sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt));
    return r;
  }, [tasks, q, cat, action, sort]);

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold">Tasks</h1>
      <p className="mt-1 text-muted">Pick a task, complete it on X, claim your reward.</p>
      {isDemo && <DemoBanner />}

      <div className="mt-8 flex flex-col gap-3 md:flex-row">
        <input className="input md:max-w-sm" placeholder="Search tasks or @handle…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input md:w-48" value={action} onChange={(e) => setAction(e.target.value as TaskAction | "all")}>
          <option value="all">All actions</option>
          {Object.entries(ACTION_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="input md:w-48" value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}>
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
              cat === c ? "bg-white text-black" : "border border-line text-muted hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Grid tasks={list} isLoading={isLoading} />
      </div>
    </div>
  );
}
