import "server-only";
import { cookies } from "next/headers";
import { refreshToken } from "./x-oauth";
import { seal, unseal } from "./seal";

/** Everything we keep about the logged-in X account, stored encrypted in a cookie. */
export type XSession = {
  id: string;
  username: string;
  name: string;
  image?: string;
  createdAt?: string; // X account creation date
  followers?: number;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // ms
};

const SESSION_COOKIE = "xtask_x";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function saveSession(s: XSession) {
  (await cookies()).set(SESSION_COOKIE, seal(s), cookieOptions(MAX_AGE));
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current X session, refreshing the access token when it has expired. */
export async function getSession(): Promise<XSession | null> {
  const s = unseal<XSession>((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return null;
  if (Date.now() < s.expiresAt - 60_000) return s;
  if (!s.refreshToken) return null;
  try {
    const t = await refreshToken(s.refreshToken);
    const next = { ...s, accessToken: t.access_token, refreshToken: t.refresh_token ?? s.refreshToken, expiresAt: Date.now() + t.expires_in * 1000 };
    await saveSession(next);
    return next;
  } catch {
    await clearSession();
    return null;
  }
}
