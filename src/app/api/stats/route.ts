import { NextResponse } from "next/server";
import { buildStats } from "@/lib/server/leaderboard";

export const runtime = "nodejs";
export const revalidate = 60; // rebuilt at most once a minute

export async function GET() {
  try {
    return NextResponse.json(await buildStats());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load stats" }, { status: 502 });
  }
}
