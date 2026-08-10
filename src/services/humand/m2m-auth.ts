// Client credentials grant para M2M authentication
// Obtiene access_token usando M2M_CLIENT_ID + M2M_CLIENT_SECRET

const M2M_CLIENT_ID = process.env.M2M_CLIENT_ID;
const M2M_CLIENT_SECRET = process.env.M2M_CLIENT_SECRET;
const JANUS_BASE_URL = process.env.JANUS_BASE_URL;

if (!M2M_CLIENT_ID || !M2M_CLIENT_SECRET || !JANUS_BASE_URL) {
  throw new Error('Missing M2M or Janus configuration');
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export const m2mAuthService = {
  async getAccessToken(): Promise<string> {
    // Reutilizar token si aún no expiró
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return cachedToken.token;
    }

    // Solicitar nuevo token a Janus
    const basicAuth = Buffer.from(`${M2M_CLIENT_ID}:${M2M_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${JANUS_BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        audience: 'views-cx', // Audience para acceder users/segmentations
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[m2m-auth] Token error:', error);
      throw new Error(`Failed to get M2M token: ${error}`);
    }

    const data = await response.json() as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    // Guardar en cache (expira 10 segundos antes de lo que dice Janus)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 10) * 1000,
    };

    return data.access_token;
  },
};
