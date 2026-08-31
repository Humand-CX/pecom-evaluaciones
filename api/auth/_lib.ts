import {
  type TokenSet,
  type JwtPayload,
  type Session,
  callJanusToken,
  buildClearCookies,
  buildTokenCookies,
  parseCookies,
  refreshTokens,
  resolveSession,
  PRIMARY_AUDIENCE,
} from './_token-base.js';

export type { TokenSet, JwtPayload, Session };
export { buildClearCookies, buildTokenCookies, parseCookies, refreshTokens, resolveSession };

const APP_CALLBACK_URL = process.env.APP_CALLBACK_URL!;

// ── Janus calls ───────────────────────────────────────────────────────────────

export async function exchangeCode(
  code: string,
  codeVerifier: string,
): Promise<TokenSet> {
  return callJanusToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: APP_CALLBACK_URL,
      resource: PRIMARY_AUDIENCE,
    }),
  );
}
