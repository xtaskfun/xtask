import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getStore } from "@/lib/server/store";
import { HttpError, loadOpenTask, resolveTask, verifyForTask } from "@/lib/server/claim-flow";
import { errorResponse, readTaskId } from "@/lib/server/http";

export const runtime = "nodejs";

/** Checks on X whether the logged-in account did the task's actions. */
export async function POST(req: Request) {
  try {
    const { taskKey } = await readTaskId(req);
    const { escrow, id } = resolveTask(taskKey);
    const session = await getSession();
    if (!session) throw new HttpError(401, "Connect your X account first.");
    const store = getStore();
    if (!store) throw new HttpError(503, "Database is not configured.");

    const { meta } = await loadOpenTask(escrow, id);
    const result = await verifyForTask(store, session, escrow, id, meta);
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
