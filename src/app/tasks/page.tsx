"use client";

import { useMemo, useState } from "react";
import TaskCard from "@/components/TaskCard";
import { ACTION_META, TASKS, TaskAction } from "@/lib/tasks";

const CATEGORIES = ["All", "Project", "Meme", "NFT", "DeFi", "Community"] as const;
const SORTS = { newest: "Newest", reward: "Highest reward", ending: "Ending soon" } as const;

export default function TasksPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [action, setAction] = useState<TaskAction | "all">("all");
  const [sort, setSort] = useState<keyof typeof SORTS>("newest");

  const list = useMemo(() => {
    let r = TASKS.filter(
      (t) =>
        (cat === "All" || t.category === cat) &&
        (action === "all" || t.actions.includes(action)) &&
        (t.title + t.creator).toLowerCase().includes(q.toLowerCase())
    );
    if (sort === "reward") r = [...r].sort((a, b) => b.rewardPerUser - a.rewardPerUser);
    if (sort === "ending") r = [...r].sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt));
    return r;
  }, [q, cat, action, sort]);

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold">Tasks</h1>
      <p className="mt-1 text-muted">Pick a task, complete it on X, claim your reward.</p>

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

      {list.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => <TaskCard key={t.id} task={t} />)}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-12 text-center text-muted">
          No tasks match your filters.
        </div>
      )}
    </div>
  );
}
