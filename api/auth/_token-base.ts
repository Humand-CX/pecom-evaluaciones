/**
 * Shared token model — used by both auth-add-staff and auth-add-user.
 * Storage: httpOnly cookies (required for CONFIDENTIAL clients).
 * Refresh: silent renewal on expired access_token; redirect to /login on missing refresh_token.
 */

const JANUS_URL = process.env.JANUS_URL!;
const CLIENT_ID = process.env.HUMAND_CLIENT_ID!;
const CLIENT_SECRET = process.env.HUMAND_CLIENT_SECRET!;

/**
 * Primary audience this app's tokens are scoped to. Fixed for sandbox clients
 * (both auth flavors register `audienceId=generic-cx-hackathon`).
 *
 * Sent as `resource` on EVERY authorize and token call. Not optional: as soon as
 * the client gains a second audience (e.g. `glados-api` via /connect-glados),
 * Janus can no longer infer the target and rejects the exchange with
 * `400 invalid_target` — which breaks login completely. Sending it from the
 * start means adding an audience later is a no-op here.
 * See docs/clusters/janus-clients.md.
 */
export const PRIMARY_AUDIENCE = 'generic-cx-hackathon';

export const COOKIE_ACCESS = 'hu_access_token';
export const COOKIE_REFRESH = 'hu_refresh_token';
export const COOKIE_OPTS = `HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax; Path=/`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  exp?: number;
  /** Humand's own numeric user id — always present for USER tokens, regardless of
   * what the community uses as employeeInternalId (email, DNI, legajo, etc). */
  user_id?: number;
}

/** Minimal response surface `resolveSession` needs to clear the session cookies. */
export interface CookieWriter {
  setHeader(name: string, value: string[]): unknown;
}

/**
 * An error response from Janus `/oauth2/token`. `error` is the OAuth error code
 * (`invalid_grant`, `invalid_client`, ...).
 */
export class JanusTokenError extends Error {
  readonly status: number;
  readonly error: string | undefined;

  constructor(status: number, error: string | undefined) {
    super(`Janus ${status}: ${error}`);
    this.status = status;
    this.error = error;
  }
}

/**
 * True when Janus rejected the refresh token itself: it was already used,
 * revoked, or expired. Retrying with the same token always fails, so the
 * session is gone and the cookies must be cleared.
 */
export function isRefreshTokenRejected(error: unknown): boolean {
  return error instanceof JanusTokenError && error.error === 'invalid_grant';
}

export interface Session {
  user: JwtPayload;
  accessToken: string;
  /** Set when tokens were silently renewed — caller must forward these Set-Cookie headers */
  renewedCookies?: string[];
}

// ── Janus token calls ─────────────────────────────────────────────────────────

export async function callJanusToken(body: URLSearchParams): Promise<TokenSet> {
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  if (!JANUS_URL) throw new Error('JANUS_URL is not set');

  try {
    const res = await fetch(`${JANUS_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = (await res.json().catch(() => ({}))) as { error?: string };
      throw new JanusTokenError(res.status, errorBody.error);
    }

    return res.json() as Promise<TokenSet>;
  } finally {
    clearTimeout(timeout);
  }
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  return callJanusToken(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      resource: PRIMARY_AUDIENCE,
    }),
  );
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function buildTokenCookies(tokens: TokenSet): string[] {
  const accessMaxAge = tokens.expires_in ?? 900;
  const refreshMaxAge = 60 * 60 * 24 * 7; // 7 days: the longest Janus refresh token lifetime (STAFF)
  return [
    `${COOKIE_ACCESS}=${tokens.access_token}; Max-Age=${accessMaxAge}; ${COOKIE_OPTS}`,
    `${COOKIE_REFRESH}=${tokens.refresh_token}; Max-Age=${refreshMaxAge}; ${COOKIE_OPTS}`,
  ];
}

export function buildClearCookies(): string[] {
  return [
    `${COOKIE_ACCESS}=; Max-Age=0; ${COOKIE_OPTS}`,
    `${COOKIE_REFRESH}=; Max-Age=0; ${COOKIE_OPTS}`,
  ];
}

export function parseCookies(req: {
  headers: { cookie?: string | string[] };
}): Record<string, string> {
  const raw = req.headers.cookie;
  const header = Array.isArray(raw) ? raw[0] : (raw ?? '');
  return Object.fromEntries(
    header.split(';').flatMap(pair => {
      const [k, ...v] = pair.trim().split('=');
      return k ? [[k.trim(), v.join('=').trim()]] : [];
    }),
  );
}

// ── JWT decode (no signature verification) ────────────────────────────────────

function decodeJwt(token: string): JwtPayload {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('Invalid JWT');
  const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const json = new TextDecoder('utf-8').decode(bytes);
  return JSON.parse(json) as JwtPayload;
}

function isExpired(payload: JwtPayload): boolean {
  return !!payload.exp && payload.exp * 1000 < Date.now();
}

// ── Session resolution ────────────────────────────────────────────────────────

/**
 * Returns the session from the cookies, refreshing it when the access token
 * expired. Every caller must forward `renewedCookies`: Janus rotates STAFF
 * refresh tokens on each refresh, so a dropped cookie leaves a dead token.
 *
 * Pass `res` only from the auth routes (`/api/auth/me`). When Janus rejects the
 * refresh token, `resolveSession` then clears the session cookies on `res`.
 * Data routes call it without `res` and only answer 401: they run in parallel,
 * and the request that loses a STAFF refresh race also gets `invalid_grant`.
 * Clearing there could erase the cookies the winning request just set.
 */
export async function resolveSession(
  req: {
    headers: { cookie?: string | string[] };
  },
  res?: CookieWriter,
): Promise<Session | null> {
  const cookies = parseCookies(req);
  const accessToken = cookies[COOKIE_ACCESS];
  const refreshToken = cookies[COOKIE_REFRESH];

  if (accessToken) {
    try {
      const payload = decodeJwt(accessToken);
      if (!isExpired(payload)) return { user: payload, accessToken };
    } catch {
      // malformed token — fall through to refresh
    }
  }

  if (!refreshToken) return null;

  try {
    const tokens = await refreshTokens(refreshToken);
    const payload = decodeJwt(tokens.access_token);
    return {
      user: payload,
      accessToken: tokens.access_token,
      renewedCookies: buildTokenCookies(tokens),
    };
  } catch (error) {
    if (res && isRefreshTokenRejected(error)) res.setHeader('Set-Cookie', buildClearCookies());
    return null;
  }
}
