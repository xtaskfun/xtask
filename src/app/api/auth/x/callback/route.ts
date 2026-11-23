import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, fetchMe, redirectUri } from "@/lib/server/x-oauth";
import { seal, unseal } from "@/lib/server/seal";
import { cookieOptions, type XSession } from "@/lib/server/session";
import { safeReturnTo } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const pending = unseal<{ state: string; verifier: string; returnTo: string }>(req.cookies.get("xtask_oauth")?.value);
  const returnTo = safeReturnTo(pending?.returnTo);
  const back = (q: string) => {
    const res = NextResponse.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${q}`, req.url));
    res.cookies.delete("xtask_oauth");
    return res;
  };

  const p = req.nextUrl.searchParams;
  if (p.get("error")) return back("x_error=denied");
  const code = p.get("code");
  if (!pending || !code || p.get("state") !== pending.state) return back("x_error=state");

  try {
    const token = await exchangeCode(code, pending.verifier, redirectUri(req.nextUrl.origin));
    const me = await fetchMe(token.access_token);
    const session: XSession = {
      id: me.id,
      username: me.username,
      name: me.name,
      image: me.profile_image_url,
      createdAt: me.created_at,
      followers: me.public_metrics?.followers_count,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + token.expires_in * 1000,
    };
    const res = back("x=connected");
    res.cookies.set("xtask_x", seal(session), cookieOptions(60 * 60 * 24 * 30));
    return res;
  } catch (e) {
    console.error(e);
    return back("x_error=failed");
  }
}
