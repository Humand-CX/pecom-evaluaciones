const CLIENT_ID = import.meta.env.VITE_HUMAND_CLIENT_ID;
const CALLBACK_URL = import.meta.env.VITE_HUMAND_CALLBACK_URL;
const API_URL = import.meta.env.VITE_HUMAND_API_URL;

if (!CLIENT_ID || !CALLBACK_URL || !API_URL) {
  throw new Error('Missing Humand OAuth configuration');
}

const OAUTH_AUTHORIZE_URL = `${API_URL.replace('/public/api/v1', '')}/oauth2/authorize`;
const OAUTH_TOKEN_URL = `${API_URL.replace('/public/api/v1', '')}/oauth2/token`;

export const humandOAuthService = {
  /**
   * Generate the OAuth login URL
   */
  getLoginUrl(state?: string): string {
    const stateParam = state || crypto.getRandomValues(new Uint8Array(16)).toString();
    localStorage.setItem('oauth_state', stateParam);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      response_type: 'code',
      state: stateParam,
      scope: 'openid profile email',
    });

    return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
  },

  /**
   * Exchange authorization code for access token
   * This should be called from a backend endpoint to avoid exposing the client secret
   */
  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
    // This would typically be called from a backend endpoint
    // For now, we'll show the structure - you'll need a backend route
    throw new Error('Use backend endpoint /api/auth/token instead');
  },

  /**
   * Store tokens in localStorage (or use a secure storage method)
   */
  storeTokens(accessToken: string, refreshToken?: string, expiresIn?: number): void {
    localStorage.setItem('humand_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('humand_refresh_token', refreshToken);
    }
    if (expiresIn) {
      const expiresAt = new Date().getTime() + expiresIn * 1000;
      localStorage.setItem('humand_token_expires_at', expiresAt.toString());
    }
  },

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    const token = localStorage.getItem('humand_access_token');
    const expiresAt = localStorage.getItem('humand_token_expires_at');

    if (!token) return null;

    // Check if token is expired
    if (expiresAt && new Date().getTime() > parseInt(expiresAt)) {
      this.clearTokens();
      return null;
    }

    return token;
  },

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    localStorage.removeItem('humand_access_token');
    localStorage.removeItem('humand_refresh_token');
    localStorage.removeItem('humand_token_expires_at');
    localStorage.removeItem('oauth_state');
  },
};
