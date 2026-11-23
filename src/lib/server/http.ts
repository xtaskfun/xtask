import { NextResponse } from "next/server";
import { HttpError } from "./claim-flow";

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

/** Only allow redirects back to our own pages. */
export function safeReturnTo(v: string | null | undefined) {
  return v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/";
}

export async function readTaskId(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
  const { taskId } = body;
  if (typeof taskId !== "string" || !/^\d{1,18}$/.test(taskId)) throw new HttpError(400, "taskId is required");
  return { taskId: BigInt(taskId), body };
}
