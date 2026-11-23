"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useXSession } from "@/lib/useXSession";

const ERRORS: Record<string, string> = {
  not_configured: "X login isn't set up on this server yet.",
  denied: "X login was cancelled.",
  state: "X login expired, please try again.",
  failed: "Couldn't connect your X account. Please try again.",
};

function XNotice() {
  const params = useSearchParams();
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const err = params.get("x_error");
    if (err) setMsg(ERRORS[err] ?? ERRORS.failed);
    if (err || params.get("x")) {
      // Clean the query string so a refresh doesn't show the notice again
      const u = new URL(window.location.href);
      u.searchParams.delete("x_error");
      u.searchParams.delete("x");
      window.history.replaceState(null, "", u.toString());
    }
  }, [params]);
  if (!msg) return null;
  return (
    <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-md rounded-xl border border-red-500/40 bg-card px-4 py-3 text-sm shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <span>{msg}</span>
        <button onClick={() => setMsg("")} className="text-muted hover:text-white" aria-label="Close">✕</button>
      </div>
    </div>
  );
}

export function XConnectButton({ full = false }: { full?: boolean }) {
  const { user, isLoading, login, logout } = useXSession();
  const [open, setOpen] = useState(false);

  if (isLoading) return <div className="h-10 w-10 animate-pulse rounded-full bg-white/10 sm:w-28" />;

  if (!user)
    return (
      <button onClick={login} className={`btn-rainbow h-10 px-4 ${full ? "w-full" : ""}`}>
        <span className="font-black">𝕏</span>
        <span className={full ? "" : "hidden sm:inline"}>Connect X</span>
      </button>
    );

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn-rainbow h-10 px-3" title={`@${user.username}`}>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-6 w-6 rounded-full" />
        ) : (
          <span className="font-black">𝕏</span>
        )}
        <span className="hidden max-w-28 truncate sm:inline">@{user.username}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-line bg-card p-1 text-sm shadow-xl">
          <div className="truncate px-3 py-2 text-muted">{user.name}</div>
          <button
            onClick={async () => {
              setOpen(false);
              await logout();
            }}
            className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/5"
          >
            Disconnect X
          </button>
        </div>
      )}
    </div>
  );
}

export default function XConnect() {
  return (
    <>
      <XConnectButton />
      <Suspense fallback={null}>
        <XNotice />
      </Suspense>
    </>
  );
}
