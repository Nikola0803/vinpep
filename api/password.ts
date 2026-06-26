import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/password  — unified password handler
 *
 * Body: { action: 'forgot', email }
 *   Triggers a WP reset email. Always returns 200 (no enumeration).
 *
 * Body: { action: 'reset', key, login, password }
 *   Validates reset key and sets new password.
 *
 * Replaces /api/forgot-password and /api/reset-password.
 *
 * Env vars: WC_URL, WC_USER, WC_APP_PASSWORD
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body ?? {};
  const WC_URL          = process.env.WC_URL;
  const WC_USER         = process.env.WC_USER;
  const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD;
  const auth = 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64');

  // ── Forgot password ───────────────────────────────────────────────────────
  if (action === 'forgot') {
    const { email } = req.body ?? {};
    if (!email || !String(email).includes('@')) {
      return res.status(200).json({ success: true }); // always 200
    }
    try {
      await fetch(`${WC_URL}/wp-json/vintage-peps/v1/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ email: String(email).trim().toLowerCase() }),
      });
    } catch (e) {
      console.error('[password/forgot]', e);
    }
    return res.status(200).json({ success: true });
  }

  // ── Reset password ────────────────────────────────────────────────────────
  if (action === 'reset') {
    const { key, login, password } = req.body ?? {};
    if (!key || !login) return res.status(400).json({ error: 'Invalid or expired reset link.' });
    if (!password || String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    try {
      const r = await fetch(`${WC_URL}/wp-json/vintage-peps/v1/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ key, login, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(400).json({ error: (data as { error?: string }).error || 'Reset link is invalid or expired.' });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('[password/reset]', e);
      return res.status(500).json({ error: 'Could not reset password. Please try again.' });
    }
  }

  return res.status(400).json({ error: 'action must be "forgot" or "reset"' });
}
