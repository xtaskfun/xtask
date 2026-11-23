"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { ESCROW_ADDRESS, ESCROW_CHAIN_ID, SLOTS, escrowAbi } from "./escrow";
import { TASKS, Task, parseMeta, getTask as getDemoTask } from "./tasks";
import { findToken } from "./tokens";

type RawTask = {
  creator: `0x${string}`;
  token: `0x${string}`;
  rewardPerUser: bigint;
  endsAt: bigint;
  claimed: number;
  refunded: boolean;
  meta: string;
};

export function toTask(id: bigint, t: RawTask): Task {
  const meta = parseMeta(t.meta);
  const token = findToken(ESCROW_CHAIN_ID, t.token);
  const endsAtMs = Number(t.endsAt) * 1000;
  return {
    id: id.toString(),
    title: meta.title,
    description: meta.description,
    creator: meta.handle || `${t.creator.slice(0, 6)}…${t.creator.slice(-4)}`,
    actions: meta.actions,
    targetUrl: meta.targetUrl,
    rewardPerUser: Number(formatUnits(t.rewardPerUser, token.decimals)),
    token: token.symbol,
    slots: SLOTS,
    filled: t.claimed,
    endsAt: new Date(endsAtMs).toISOString(),
    category: meta.category,
    onchain: {
      creator: t.creator,
      token: t.token,
      decimals: token.decimals,
      rewardRaw: t.rewardPerUser,
      refunded: t.refunded,
      ended: t.refunded || Date.now() > endsAtMs,
    },
  };
}

/** All tasks: from the escrow contract when deployed, otherwise demo data. */
export function useTasks(limit = 60) {
  const q = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "getTasks",
    args: [0n, BigInt(limit)],
    chainId: ESCROW_CHAIN_ID,
    query: { enabled: !!ESCROW_ADDRESS, refetchInterval: 30_000 },
  });

  const tasks = useMemo(() => {
    if (!ESCROW_ADDRESS) return TASKS;
    if (!q.data) return [];
    const [ids, list] = q.data;
    return list.map((t, i) => toTask(ids[i], t));
  }, [q.data]);

  return { tasks, isDemo: !ESCROW_ADDRESS, isLoading: !!ESCROW_ADDRESS && q.isLoading, error: q.error };
}

export function useTask(id: string) {
  const valid = /^\d+$/.test(id);
  const q = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "getTask",
    args: [valid ? BigInt(id) : 0n],
    chainId: ESCROW_CHAIN_ID,
    query: { enabled: !!ESCROW_ADDRESS && valid },
  });

  const task = useMemo(() => {
    if (!ESCROW_ADDRESS) return getDemoTask(id);
    return q.data ? toTask(BigInt(id), q.data) : undefined;
  }, [q.data, id]);

  return { task, isDemo: !ESCROW_ADDRESS, isLoading: !!ESCROW_ADDRESS && q.isLoading, refetch: q.refetch };
}
