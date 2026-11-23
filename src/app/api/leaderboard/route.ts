import { NextResponse } from "next/server";
import { buildLeaderboard } from "@/lib/server/leaderboard";

export const runtime = "nodejs";
export const revalidate = 60; // rebuilt at most once a minute

export async function GET() {
  try {
    return NextResponse.json(await buildLeaderboard());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ rows: [], ethUsd: null, updatedAt: new Date().toISOString(), error: "Could not load the leaderboard" }, { status: 502 });
  }
}
