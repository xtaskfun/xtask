"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export type XUserPublic = { id: string; username: string; name: string; image?: string };

export function useXSession() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["x-session"],
    queryFn: async (): Promise<{ configured: boolean; user: XUserPublic | null }> => {
      const r = await fetch("/api/auth/x/me", { cache: "no-store" });
      return r.ok ? r.json() : { configured: false, user: null };
    },
    staleTime: 60_000,
  });

  const login = () => {
    const here = window.location.pathname;
    window.location.href = `/api/auth/x/login?returnTo=${encodeURIComponent(here)}`;
  };
  const logout = async () => {
    await fetch("/api/auth/x/logout", { method: "POST" });
    await qc.invalidateQueries({ queryKey: ["x-session"] });
  };

  return {
    user: q.data?.user ?? null,
    configured: q.data?.configured ?? false,
    isLoading: q.isLoading,
    login,
    logout,
    refetch: q.refetch,
  };
}
