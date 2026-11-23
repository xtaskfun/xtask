"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { ESCROWS, HAS_ESCROW, escrowAbi, parseTaskKey, taskKey, type Escrow } from "./escrow";
import { TASKS, Task, parseMeta, getTask as getDemoTask } from "./tasks";
import { findToken } from "./tokens";

type RawTask = {
  creator: `0x${string}`;
  token: `0x${string}`;
  rewardPerUser: bigint;
  endsAt: bigint;
  slots: number;
  claimed: number;
  refunded: boolean;
  meta: string;
};

export function toTask(escrow: Escrow, id: bigint, t: RawTask): Task {
  const meta = parseMeta(t.meta);
  const token = findToken(escrow.chain.id, t.token);
  const endsAtMs = Number(t.endsAt) * 1000;
  return {
    id: taskKey(escrow.chain.id, id),
    title: meta.title,
    description: meta.description,
    creator: meta.handle || `${t.creator.slice(0, 6)}…${t.creator.slice(-4)}`,
    actions: meta.actions,
    targetUrl: meta.targetUrl,
    rewardPerUser: Number(formatUnits(t.rewardPerUser, token.decimals)),
    token: token.symbol,
    slots: t.slots,
    filled: t.claimed,
    endsAt: new Date(endsAtMs).toISOString(),
    category: meta.category,
    onchain: {
      chainId: escrow.chain.id,
      escrow: escrow.address,
      taskId: id,
      creator: t.creator,
      token: t.token,
      decimals: token.decimals,
      rewardRaw: t.rewardPerUser,
      refunded: t.refunded,
      ended: t.refunded || Date.now() > endsAtMs,
    },
  };
}

/** All tasks from every configured escrow (newest first), or demo data if none. */
export function useTasks(limitPerChain = 60) {
  const q = useReadContracts({
    contracts: ESCROWS.map((e) => ({
      address: e.address,
      abi: escrowAbi,
      functionName: "getTasks" as const,
      args: [0n, BigInt(limitPerChain)] as const,
      chainId: e.chain.id,
    })),
    query: { enabled: HAS_ESCROW, refetchInterval: 30_000 },
  });

  const tasks = useMemo(() => {
    if (!HAS_ESCROW) return TASKS;
    if (!q.data) return [];
    return q.data
      .flatMap((r, i) => {
        if (r.status !== "success") return [];
        const [ids, list] = r.result as readonly [readonly bigint[], readonly RawTask[]];
        return list.map((t, j) => toTask(ESCROWS[i], ids[j], t));
      })
      .sort((a, b) => +new Date(b.endsAt) - +new Date(a.endsAt));
  }, [q.data]);

  return { tasks, isDemo: !HAS_ESCROW, isLoading: HAS_ESCROW && q.isLoading, error: q.error };
}

export function useTask(key: string) {
  const parsed = HAS_ESCROW ? parseTaskKey(key) : null;
  const q = useReadContract({
    address: parsed?.escrow.address,
    abi: escrowAbi,
    functionName: "getTask",
    args: [parsed?.id ?? 0n],
    chainId: parsed?.escrow.chain.id,
    query: { enabled: !!parsed },
  });

  const task = useMemo(() => {
    if (!HAS_ESCROW) return getDemoTask(key);
    return parsed && q.data ? toTask(parsed.escrow, parsed.id, q.data) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, key]);

  return { task, isDemo: !HAS_ESCROW, isLoading: !!parsed && q.isLoading, refetch: q.refetch };
}
