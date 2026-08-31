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
      const errorBody = await res.json();
      throw new Error(`Janus ${res.status}: ${(errorBody as { error?: string }).error}`);
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
  const refreshMaxAge = 60 * 60 * 24 * 30; // 30 days
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

export async function resolveSession(req: {
  headers: { cookie?: string | string[] };
}): Promise<Session | null> {
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
  } catch {
    return null;
  }
}
