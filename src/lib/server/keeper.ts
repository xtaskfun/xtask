import "server-only";
import { createWalletClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ALL_ESCROWS, ESCROWS, escrowAbi, taskKey } from "../escrow";
import { publicClient } from "./claim-flow";

const PAGE = 200n;
/** Refund transactions per network per run, so one run never times out. */
const MAX_PER_RUN = 10;

/**
 * The wallet that sends automatic refunds and pays their gas. Uses KEEPER_PRIVATE_KEY if set,
 * otherwise the claim signer's key. It only needs a little ETH on each network.
 */
export function keeperAccount() {
  const key = process.env.KEEPER_PRIVATE_KEY || process.env.SIGNER_PRIVATE_KEY;
  if (!key) return null;
  try {
    return privateKeyToAccount(key as Hex);
  } catch {
    return null;
  }
}

export type RefundResult = { task: string; status: "refunded" | "failed"; tx?: Hex; error?: string };

/** Finds ended tasks with unclaimed slots on every escrow and refunds them to their creators. */
export async function refundEndedTasks(): Promise<{ keeper: Address | null; results: RefundResult[]; due: number }> {
  const account = keeperAccount();
  if (!account) return { keeper: null, results: [], due: 0 };

  const results: RefundResult[] = [];
  let due = 0;

  // Includes retired networks, so their ended tasks are still refunded to the creators
  for (const escrow of ALL_ESCROWS) {
    const client = publicClient(escrow.chain);
    const wallet = createWalletClient({
      account,
      chain: escrow.chain,
      transport: http(process.env[`ESCROW_RPC_URL_${escrow.chain.id}`] || process.env.ESCROW_RPC_URL || undefined),
    });

    // "Ended" is judged by the chain's clock, exactly like the contract does
    const now = (await client.getBlock()).timestamp;
    // Collect every task that has ended, still holds rewards and hasn't been refunded yet
    const todo: bigint[] = [];
    for (let offset = 0n; ; offset += PAGE) {
      let page;
      try {
        page = await client.readContract({ address: escrow.address, abi: escrowAbi, functionName: "getTasks", args: [offset, PAGE] });
      } catch {
        break;
      }
      const [ids, list] = page;
      list.forEach((t, i) => {
        if (!t.refunded && t.endsAt < now && t.claimed < t.slots) todo.push(ids[i]);
      });
      if (BigInt(list.length) < PAGE) break;
    }
    due += todo.length;

    for (const id of todo.slice(0, MAX_PER_RUN)) {
      const key = taskKey(escrow.chain.id, id);
      try {
        const hash = await wallet.writeContract({ address: escrow.address, abi: escrowAbi, functionName: "refund", args: [id] });
        const receipt = await client.waitForTransactionReceipt({ hash, timeout: 30_000 });
        results.push({ task: key, status: receipt.status === "success" ? "refunded" : "failed", tx: hash });
      } catch (e) {
        const msg = e instanceof Error ? (e as { shortMessage?: string }).shortMessage ?? e.message : String(e);
        results.push({ task: key, status: "failed", error: msg.slice(0, 200) });
      }
    }
  }

  return { keeper: account.address, results, due };
}

/** Refunds one task right away if it has ended and still holds rewards (used when someone opens it). */
export async function refundIfDue(escrow: (typeof ESCROWS)[number], id: bigint): Promise<RefundResult | null> {
  const account = keeperAccount();
  if (!account) return null;
  const client = publicClient(escrow.chain);
  let t;
  try {
    t = await client.readContract({ address: escrow.address, abi: escrowAbi, functionName: "getTask", args: [id] });
  } catch {
    return null; // unknown task: nothing to refund
  }
  const now = (await client.getBlock()).timestamp;
  if (t.refunded || t.endsAt >= now || t.claimed >= t.slots) return null;
  const wallet = createWalletClient({
    account,
    chain: escrow.chain,
    transport: http(process.env[`ESCROW_RPC_URL_${escrow.chain.id}`] || process.env.ESCROW_RPC_URL || undefined),
  });
  const key = taskKey(escrow.chain.id, id);
  try {
    const hash = await wallet.writeContract({ address: escrow.address, abi: escrowAbi, functionName: "refund", args: [id] });
    const receipt = await client.waitForTransactionReceipt({ hash, timeout: 30_000 });
    return { task: key, status: receipt.status === "success" ? "refunded" : "failed", tx: hash };
  } catch (e) {
    const msg = e instanceof Error ? (e as { shortMessage?: string }).shortMessage ?? e.message : String(e);
    return { task: key, status: "failed", error: msg.slice(0, 200) };
  }
}
