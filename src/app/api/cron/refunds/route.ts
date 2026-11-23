import { NextResponse } from "next/server";
import { refundEndedTasks } from "@/lib/server/keeper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Called by Vercel Cron (see vercel.json). Refunds unclaimed rewards of ended tasks to their
 * creators. If CRON_SECRET is set, Vercel sends it as a Bearer token and other callers are refused.
 * Calling it is harmless anyway: refunds can only ever pay the task creator.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const out = await refundEndedTasks();
  if (!out.keeper) return NextResponse.json({ error: "No keeper key configured" }, { status: 503 });
  return NextResponse.json(out);
}
