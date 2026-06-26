import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/login
 * Body: { email: string, password: string }
 *
 * Validates credentials against WordPress via our custom REST endpoint.
 * Returns { success, userId, displayName, email } on success.
 *
 * Requires the vintage-peps-cms plugin endpoint POST /vintage-peps/v1/login.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const WC_URL = process.env.WC_URL;
  const WC_USER = process.env.WC_USER;
  const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD;

  if (!WC_URL) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const r = await fetch(`${WC_URL}/wp-json/vintage-peps/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64'),
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(401).json({ error: data.error || 'Invalid email or password.' });
    }

    return res.status(200).json(data);
  } catch (e) {
    console.error('[login]', e);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
