import { NextResponse } from "next/server";
import { HttpError, resolveTask } from "@/lib/server/claim-flow";
import { errorResponse, readTaskId } from "@/lib/server/http";
import { refundIfDue } from "@/lib/server/keeper";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Refunds an ended task's unclaimed rewards to its creator right away. The task page calls this
 * when it sees an ended task; it is a no-op otherwise. Safe to expose: refunds only pay the creator,
 * and each task can be refunded once.
 */
export async function POST(req: Request) {
  try {
    const { taskKey } = await readTaskId(req);
    const { escrow, id } = resolveTask(taskKey);
    const result = await refundIfDue(escrow, id);
    if (!result) return NextResponse.json({ status: "not-due" });
    if (result.status === "failed") throw new HttpError(502, result.error ?? "Refund failed");
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
