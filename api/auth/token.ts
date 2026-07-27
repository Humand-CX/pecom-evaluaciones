import { VercelRequest, VercelResponse } from '@vercel/node';

const HUMAND_API_URL = process.env.VITE_HUMAND_API_URL || 'https://api-prod.humand.co/public/api/v1';
const CLIENT_ID = process.env.VITE_HUMAND_CLIENT_ID;
const CLIENT_SECRET = process.env.HUMAND_CLIENT_SECRET;
const CALLBACK_URL = process.env.VITE_HUMAND_CALLBACK_URL;

if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
  throw new Error('Missing OAuth configuration');
}

const OAUTH_TOKEN_URL = `${HUMAND_API_URL.replace('/public/api/v1', '')}/oauth/token`;

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

    // Exchange code for token with Humand
    const tokenResponse = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: CALLBACK_URL,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Humand token error:', error);
      return res.status(400).json({ error: 'Failed to exchange code for token' });
    }

    const data = await tokenResponse.json();

    // Return tokens to frontend
    return res.status(200).json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
