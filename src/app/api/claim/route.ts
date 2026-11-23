import { NextResponse } from "next/server";
import { createPublicClient, http, isAddress, getAddress, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ESCROW_ADDRESS, ESCROW_CHAIN, escrowAbi } from "@/lib/escrow";
import { parseMeta } from "@/lib/tasks";

export const runtime = "nodejs";

const SIGNATURE_TTL_SECONDS = 10 * 60;

/**
 * Checks on X that `user` really did every action of the task.
 *
 * NOT IMPLEMENTED YET. Until it is, claims are refused unless
 * CLAIM_VERIFICATION=off is set — only ever do that on a testnet, because
 * then anyone can claim every slot without doing the task.
 *
 * To implement: look up the X account linked to `user` (X OAuth login),
 * check each action via the X API, and make sure one X account can only
 * claim once per task (store claims in a database).
 */
async function verifyXActions(_taskId: bigint, _user: Address, _actions: string[]) {
  if (process.env.CLAIM_VERIFICATION === "off") return { ok: true as const };
  return { ok: false as const, reason: "X verification is not live yet." };
}

export async function POST(req: Request) {
  const key = process.env.SIGNER_PRIVATE_KEY;
  if (!ESCROW_ADDRESS || !key) {
    return NextResponse.json({ error: "Claims are not configured on this server." }, { status: 503 });
  }

  let body: { taskId?: unknown; user?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { taskId, user } = body;
  if (typeof taskId !== "string" || !/^\d{1,18}$/.test(taskId) || typeof user !== "string" || !isAddress(user)) {
    return NextResponse.json({ error: "taskId and user are required" }, { status: 400 });
  }
  const id = BigInt(taskId);
  const wallet = getAddress(user);

  const client = createPublicClient({ chain: ESCROW_CHAIN, transport: http(process.env.ESCROW_RPC_URL) });

  let task;
  try {
    task = await client.readContract({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: "getTask", args: [id] });
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  const now = Math.floor(Date.now() / 1000);
  if (task.refunded || BigInt(now) > task.endsAt) return NextResponse.json({ error: "Task has ended" }, { status: 409 });
  if (task.claimed >= 100) return NextResponse.json({ error: "Task is full" }, { status: 409 });

  const already = await client.readContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "hasClaimed",
    args: [id, wallet],
  });
  if (already) return NextResponse.json({ error: "Already claimed" }, { status: 409 });

  const check = await verifyXActions(id, wallet, parseMeta(task.meta).actions);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 403 });

  const deadline = BigInt(Math.min(now + SIGNATURE_TTL_SECONDS, Number(task.endsAt)));
  const signer = privateKeyToAccount(key as `0x${string}`);
  const signature = await signer.signTypedData({
    domain: { name: "xtask.fun", version: "1", chainId: ESCROW_CHAIN.id, verifyingContract: ESCROW_ADDRESS },
    types: {
      Claim: [
        { name: "taskId", type: "uint256" },
        { name: "user", type: "address" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Claim",
    message: { taskId: id, user: wallet, deadline },
  });

  return NextResponse.json({ deadline: deadline.toString(), signature });
}
