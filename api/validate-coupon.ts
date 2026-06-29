/**
 * GET /api/validate-coupon?code=SHIP10
 *
 * Calls our public WP plugin endpoint (no auth needed).
 * Forces HTTP — VPS has no SSL cert yet; server-side HTTP is fine (not mixed content).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = (process.env.WC_URL || process.env.VITE_WC_URL || '').replace(/\/$/, '').replace(/^https:\/\//, 'http://');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const code = String(req.query.code ?? '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'code param required' });
  if (!WC_URL) return res.status(500).json({ error: 'WC_URL not configured.' });

  try {
    const r = await fetch(
      `${WC_URL}/wp-json/vp-crm/v1/validate-coupon?code=${encodeURIComponent(code)}`,
      { signal: AbortSignal.timeout(8_000) }
    );
    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('[validate-coupon]', err);
    return res.status(500).json({ error: 'Could not reach store. Please try again.' });
  }
}
