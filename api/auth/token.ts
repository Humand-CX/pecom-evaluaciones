import { VercelRequest, VercelResponse } from '@vercel/node';
import { buildTokenCookies } from './_lib.js';

const CLIENT_ID = process.env.VITE_HUMAND_CLIENT_ID;
const CLIENT_SECRET = process.env.HUMAND_CLIENT_SECRET;
const CALLBACK_URL = process.env.VITE_HUMAND_CALLBACK_URL;

if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
  throw new Error('Missing OAuth configuration');
}

const JANUS_TOKEN_URL = 'https://api-prod.humand.co/api/v1/janus/oauth2/token';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Exchange code for token with Janus using Basic Auth
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const tokenResponse = await fetch(JANUS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: CALLBACK_URL,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Humand token error:', error);
      return res.status(400).json({ error: 'Failed to exchange code for token' });
    }

    const data = await tokenResponse.json();

    // Set HttpOnly cookies using buildTokenCookies
    const cookies = buildTokenCookies({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });

    res.setHeader('Set-Cookie', cookies);

    // Return success to frontend (tokens are in cookies now)
    return res.status(200).json({
      ok: true,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
