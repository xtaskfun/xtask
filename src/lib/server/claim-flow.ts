import "server-only";
import { createPublicClient, http } from "viem";
import { ESCROW_ADDRESS, ESCROW_CHAIN, escrowAbi } from "../escrow";
import { parseMeta, type TaskMeta } from "../tasks";
import { parseTarget } from "../x/target";
import type { XSession } from "./session";
import type { Store } from "./store";
import { XApiError, accountEligibility, makeXApi, verifyActions, type VerifyResult } from "./x-verify";

export const VERIFIED_TTL = 15 * 60; // a passed check is reused for the claim for 15 minutes

export const publicClient = () =>
  createPublicClient({ chain: ESCROW_CHAIN, transport: http(process.env.ESCROW_RPC_URL) });

const scope = () => `${ESCROW_CHAIN.id}:${ESCROW_ADDRESS?.toLowerCase()}`;
export const keys = {
  verified: (taskId: bigint, xId: string) => `xtask:verified:${scope()}:${taskId}:${xId}`,
  /** Which wallet this X account claimed the task with. Never expires. */
  claim: (taskId: bigint, xId: string) => `xtask:claim:${scope()}:${taskId}:${xId}`,
};

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function loadOpenTask(taskId: bigint) {
  if (!ESCROW_ADDRESS) throw new HttpError(503, "Escrow contract is not configured.");
  let task;
  try {
    task = await publicClient().readContract({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "getTask", args: [taskId] });
  } catch {
    throw new HttpError(404, "Task not found");
  }
  if (task.refunded || BigInt(Math.floor(Date.now() / 1000)) > task.endsAt) throw new HttpError(409, "Task has ended");
  if (task.claimed >= 100) throw new HttpError(409, "Task is full");
  return { task, meta: parseMeta(task.meta) };
}

/** Runs the X checks for this account and task, caching a pass. */
export async function verifyForTask(store: Store, session: XSession, taskId: bigint, meta: TaskMeta): Promise<VerifyResult> {
  if (await store.get(keys.verified(taskId, session.id))) {
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
    if (e instanceof XApiError && e.status === 429) throw new HttpError(429, "X is rate limiting checks. Try again in a few minutes.");
    if (e instanceof XApiError && (e.status === 401 || e.status === 403))
      throw new HttpError(401, "X access expired. Please reconnect your X account.");
    throw new HttpError(502, "Couldn't reach X. Try again shortly.");
  }
  if (result.ok) await store.set(keys.verified(taskId, session.id), "1", VERIFIED_TTL);
  return result;
}
