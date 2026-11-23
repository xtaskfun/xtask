import { createHash, randomBytes } from "crypto";

// X_OAUTH_SCOPES (space separated) can override this, e.g. to debug a login with fewer permissions.
export const X_SCOPES = (process.env.X_OAUTH_SCOPES || "tweet.read users.read follows.read like.read offline.access")
  .split(/\s+/)
  .filter(Boolean);
// Overridable only so the whole flow can be tested against a local mock of X.
const AUTHORIZE_URL = process.env.X_AUTHORIZE_URL || "https://x.com/i/oauth2/authorize";
export const X_API = process.env.X_API_BASE_URL || "https://api.x.com/2";
const TOKEN_URL = `${X_API}/oauth2/token`;

export type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number; scope: string };

function clientId() {
  const id = process.env.X_CLIENT_ID;
  if (!id) throw new Error("X_CLIENT_ID is not set");
  return id;
}

export function isXConfigured() {
  return !!process.env.X_CLIENT_ID && !!process.env.SESSION_SECRET;
}

/** Callback URL — must match exactly what is registered in the X developer portal. */
export function redirectUri(origin: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  return `${base}/api/auth/x/callback`;
}

export function pkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function authorizeUrl(params: { redirectUri: string; state: string; challenge: string }) {
  const u = new URL(AUTHORIZE_URL);
  u.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    redirect_uri: params.redirectUri,
    scope: X_SCOPES.join(" "),
    state: params.state,
    code_challenge: params.challenge,
    code_challenge_method: "S256",
  }).toString();
  return u.toString();
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  const secret = process.env.X_CLIENT_SECRET;
  // Confidential clients authenticate with Basic auth; public clients send client_id in the body.
  if (secret) headers.Authorization = `Basic ${Buffer.from(`${clientId()}:${secret}`).toString("base64")}`;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers,
    body: new URLSearchParams({ ...body, client_id: clientId() }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`X token request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export const exchangeCode = (code: string, verifier: string, redirect: string) =>
  tokenRequest({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: redirect });

export const refreshToken = (token: string) => tokenRequest({ grant_type: "refresh_token", refresh_token: token });

export type XUser = {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  created_at?: string;
  public_metrics?: { followers_count: number };
};

export async function fetchMe(accessToken: string): Promise<XUser> {
  const res = await fetch(`${X_API}/users/me?user.fields=created_at,public_metrics,profile_image_url`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`X /users/me failed (${res.status})`);
  return (await res.json()).data;
}
