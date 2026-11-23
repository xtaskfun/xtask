import "server-only";
import { createPublicClient, http, type Chain } from "viem";
import { escrowAbi, parseTaskKey, type Escrow } from "../escrow";
import { parseMeta, type TaskMeta } from "../tasks";
import { parseTarget } from "../x/target";
import type { XSession } from "./session";
import type { Store } from "./store";
import { XApiError, accountEligibility, makeXApi, verifyActions, type VerifyResult } from "./x-verify";

export const VERIFIED_TTL = 15 * 60; // a passed check is reused for the claim for 15 minutes

/** RPC per chain: ESCROW_RPC_URL_<chainId> overrides the chain's public RPC. */
export const publicClient = (chain: Chain) =>
  createPublicClient({
    chain,
    transport: http(process.env[`ESCROW_RPC_URL_${chain.id}`] || process.env.ESCROW_RPC_URL || undefined),
  });

const scope = (e: Escrow) => `${e.chain.id}:${e.address.toLowerCase()}`;
export const keys = {
  verified: (e: Escrow, taskId: bigint, xId: string) => `xtask:verified:${scope(e)}:${taskId}:${xId}`,
  /** Which wallet this X account claimed the task with. Never expires. */
  claim: (e: Escrow, taskId: bigint, xId: string) => `xtask:claim:${scope(e)}:${taskId}:${xId}`,
};

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Resolves "<chainId>-<id>" to its escrow, or throws 404. */
export function resolveTask(key: string) {
  const parsed = parseTaskKey(key);
  if (!parsed) throw new HttpError(404, "Task not found");
  return parsed;
}

export async function loadOpenTask(escrow: Escrow, taskId: bigint) {
  let task;
  try {
    task = await publicClient(escrow.chain).readContract({ address: escrow.address, abi: escrowAbi, functionName: "getTask", args: [taskId] });
  } catch {
    throw new HttpError(404, "Task not found");
  }
  if (task.refunded || BigInt(Math.floor(Date.now() / 1000)) > task.endsAt) throw new HttpError(409, "Task has ended");
  if (task.claimed >= task.slots) throw new HttpError(409, "Task is full");
  return { task, meta: parseMeta(task.meta) };
}

/** Runs the X checks for this account and task, caching a pass. */
export async function verifyForTask(store: Store, session: XSession, escrow: Escrow, taskId: bigint, meta: TaskMeta): Promise<VerifyResult> {
  if (await store.get(keys.verified(escrow, taskId, session.id))) {
    return { ok: true, actions: Object.fromEntries(meta.actions.map((a) => [a, true])) };
  }

  const eligible = accountEligibility(session);
  if (!eligible.ok) throw new HttpError(403, eligible.reason);

  const target = parseTarget(meta.targetUrl);
  if (!target) throw new HttpError(422, "This task has an invalid X link and can't be verified.");

  let result: VerifyResult;
  try {
    result = await verifyActions(makeXApi(session.accessToken), session.id, target, meta.actions);
  } catch (e) {
    if (e instanceof XApiError) {
      const why = e.detail ? ` (${e.detail})` : "";
      if (e.status === 429) throw new HttpError(429, "X is rate limiting checks. Try again in a few minutes.");
      if (e.status === 401) throw new HttpError(401, "X access expired. Please reconnect your X account.");
      if (e.status === 402) throw new HttpError(502, `X API plan or credits don't cover this check (402)${why}.`);
      if (e.status === 403) throw new HttpError(502, `X API refused the check (403)${why}.`);
      throw new HttpError(502, `X API error ${e.status}${why}.`);
    }
    console.error("verify failed", e);
    throw new HttpError(502, "Couldn't reach X. Try again shortly.");
  }
  if (result.ok) await store.set(keys.verified(escrow, taskId, session.id), "1", VERIFIED_TTL);
  return result;
}
