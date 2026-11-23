import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { isXConfigured } from "@/lib/server/x-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isXConfigured()) return NextResponse.json({ configured: false, user: null });
  const s = await getSession();
  return NextResponse.json({
    configured: true,
    user: s ? { id: s.id, username: s.username, name: s.name, image: s.image } : null,
  });
}
