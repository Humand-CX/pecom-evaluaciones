import { type VercelRequest, type VercelResponse } from '@vercel/node';

import {
  buildClearCookies,
  buildTokenCookies,
  exchangeCode,
  parseCookies,
  refreshTokens,
  resolveSession,
} from './_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segments = (req.query.path ?? req.query['...path']) as
    | string
    | string[]
    | undefined;
  const route = Array.isArray(segments) ? segments[0] : (segments ?? '');

  switch (route) {
    case 'callback':
      return handleCallback(req, res);
    case 'me':
      return handleMe(req, res);
    case 'refresh':
      return handleRefresh(req, res);
    case 'logout':
      return handleLogout(res);
    default:
      return res.status(404).send('Not found');
  }
}

// ── GET /api/auth/callback?code=...&code_verifier=... ─────────────────────────

async function handleCallback(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string | undefined;
  const codeVerifier = req.query.code_verifier as string | undefined;

  if (!code) {
    return res.redirect('/error?reason=missing_code');
  }

  try {
    const tokens = await exchangeCode(code, codeVerifier || '');
    const cookies = buildTokenCookies(tokens);
    res.setHeader('Set-Cookie', cookies);
    return res.redirect('/');
  } catch (error) {
    console.error('Token exchange failed:', error);
    return res.redirect('/error?reason=auth_failed');
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

async function handleMe(req: VercelRequest, res: VercelResponse) {
  console.log('Auth /me: Headers:', req.headers);
  console.log('Auth /me: Cookie header:', req.headers.cookie);

  const session = await resolveSession(req);
  console.log('Auth /me: Resolved session:', session);

  if (!session) {
    console.log('Auth /me: No session found, returning 401');
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  if (session.renewedCookies) {
    res.setHeader('Set-Cookie', session.renewedCookies);
  }

  return res.status(200).json(session.user);
}

// ── POST /api/auth/refresh ────────────────────────────────────────────────────

async function handleRefresh(req: VercelRequest, res: VercelResponse) {
  const cookies = parseCookies(req);
  const refreshToken = cookies['hu_refresh_token'];

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    const tokens = await refreshTokens(refreshToken);
    res.setHeader('Set-Cookie', buildTokenCookies(tokens));
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(401).json({ error: 'Refresh failed' });
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

async function handleLogout(res: VercelResponse) {
  res.setHeader('Set-Cookie', buildClearCookies());
  return res.status(200).json({ ok: true });
}
