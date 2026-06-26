import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/reset-password
 * Body: { key: string, login: string, password: string }
 * Validates the reset key and sets the new password via WP REST.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { key, login, password } = req.body ?? {};

  if (!key || !login) {
    return res.status(400).json({ error: 'Invalid or expired reset link.' });
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const WC_URL = process.env.WC_URL;
  const WC_USER = process.env.WC_USER;
  const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD;

  try {
    const r = await fetch(`${WC_URL}/wp-json/vintage-peps/v1/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64'),
      },
      body: JSON.stringify({ key, login, password }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(400).json({ error: data.error || 'Reset link is invalid or expired.' });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('[reset-password]', e);
    return res.status(500).json({ error: 'Could not reset password. Please try again.' });
  }
}
