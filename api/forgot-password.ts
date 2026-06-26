import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/forgot-password
 * Body: { email: string }
 * Triggers a WP password reset email via the vintage-peps/v1/forgot-password endpoint.
 * Always returns 200 to prevent email enumeration.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body ?? {};
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  const WC_URL = process.env.WC_URL;
  const WC_USER = process.env.WC_USER;
  const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD;

  try {
    await fetch(`${WC_URL}/wp-json/vintage-peps/v1/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64'),
      },
      body: JSON.stringify({ email: String(email).trim().toLowerCase() }),
    });
  } catch (e) {
    console.error('[forgot-password]', e);
    // Still return success to prevent enumeration
  }

  // Always 200 — never reveal whether email exists
  return res.status(200).json({ success: true });
}
