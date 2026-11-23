import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ESCROW_ADDRESS, ESCROW_CHAIN, escrowAbi } from "@/lib/escrow";
import { getSession } from "@/lib/server/session";
import { getStore } from "@/lib/server/store";
import { HttpError, keys, loadOpenTask, publicClient, verifyForTask } from "@/lib/server/claim-flow";
import { errorResponse, readTaskId } from "@/lib/server/http";
import { VERIFICATION_MODE } from "@/lib/site";

export const runtime = "nodejs";

const SIGNATURE_TTL_SECONDS = 10 * 60;

/**
 * Returns a signature that lets `user` claim 1% of the task pool from the escrow.
 * With NEXT_PUBLIC_VERIFICATION_MODE=x it also requires a logged-in X account, all
 * actions verified on X, and that this X account hasn't claimed with another wallet.
 * Otherwise there is no check beyond the contract's one-claim-per-wallet rule.
 */
export async function POST(req: Request) {
  try {
    const key = process.env.SIGNER_PRIVATE_KEY;
    if (!ESCROW_ADDRESS || !key) throw new HttpError(503, "Claims are not configured on this server.");

    const { taskId, body } = await readTaskId(req);
    if (typeof body.user !== "string" || !isAddress(body.user)) throw new HttpError(400, "user wallet is required");
    const wallet = getAddress(body.user);

    const { task, meta } = await loadOpenTask(taskId);

    const already = await publicClient().readContract({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "hasClaimed",
      args: [taskId, wallet],
    });
    if (already) throw new HttpError(409, "Already claimed");

    // In "none" mode there is no check: the contract still allows one claim per wallet.
    const skipX = VERIFICATION_MODE !== "x" || process.env.CLAIM_VERIFICATION === "off";
    if (!skipX) {
      const store = getStore();
      if (!store) throw new HttpError(503, "Database is not configured.");
      const session = await getSession();
      if (!session) throw new HttpError(401, "Connect your X account first.");

      const lockKey = keys.claim(taskId, session.id);
      const lockedTo = await store.get(lockKey);
      if (lockedTo && lockedTo !== wallet) throw new HttpError(409, "This X account already claimed this task with another wallet.");

      const result = await verifyForTask(store, session, taskId, meta);
      if (!result.ok) throw new HttpError(403, "Not all actions are done yet on X.");

      // Bind this X account to this wallet for the task — atomically, so two
      // parallel requests with different wallets can't both get a signature.
      if (!lockedTo && !(await store.setNX(lockKey, wallet)) && (await store.get(lockKey)) !== wallet) {
        throw new HttpError(409, "This X account already claimed this task with another wallet.");
      }
    }

    const now = Math.floor(Date.now() / 1000);
    const deadline = BigInt(Math.min(now + SIGNATURE_TTL_SECONDS, Number(task.endsAt)));
    const signature = await privateKeyToAccount(key as `0x${string}`).signTypedData({
      domain: { name: "xtask.fun", version: "1", chainId: ESCROW_CHAIN.id, verifyingContract: ESCROW_ADDRESS },
      types: {
        Claim: [
          { name: "taskId", type: "uint256" },
          { name: "user", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      },
      primaryType: "Claim",
      message: { taskId, user: wallet, deadline },
    });

    return NextResponse.json({ deadline: deadline.toString(), signature });
  } catch (e) {
    return errorResponse(e);
  }
}
