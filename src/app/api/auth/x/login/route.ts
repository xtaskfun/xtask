import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { authorizeUrl, isXConfigured, pkcePair, redirectUri } from "@/lib/server/x-oauth";
import { seal } from "@/lib/server/seal";
import { cookieOptions } from "@/lib/server/session";
import { safeReturnTo } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const returnTo = safeReturnTo(req.nextUrl.searchParams.get("returnTo"));
  if (!isXConfigured()) return NextResponse.redirect(new URL(`${returnTo}?x_error=not_configured`, req.url));

  const state = randomBytes(16).toString("base64url");
  const { verifier, challenge } = pkcePair();
  const res = NextResponse.redirect(authorizeUrl({ redirectUri: redirectUri(req.nextUrl.origin), state, challenge }));
  res.cookies.set("xtask_oauth", seal({ state, verifier, returnTo }), cookieOptions(600));
  return res;
}
