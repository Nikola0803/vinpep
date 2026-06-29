/**
 * GET /api/validate-coupon?code=SHIP10
 *
 * Validates a coupon by calling our own public WP plugin endpoint
 * (vp-crm/v1/validate-coupon) which uses WC PHP internals directly.
 * No WC consumer key auth needed — works over HTTP.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = (process.env.WC_URL || process.env.VITE_WC_URL || '').replace(/\/$/, '');

async function pluginFetch(path: string): Promise<Response> {
  try {
    return await fetch(WC_URL + path, { signal: AbortSignal.timeout(8_000) });
  } catch {
    // SSL fallback — VPS may not have cert yet
    const http = WC_URL.replace(/^https:\/\//, 'http://');
    return fetch(http + path, { signal: AbortSignal.timeout(8_000) });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const code = String(req.query.code ?? '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'code param required' });

  if (!WC_URL) return res.status(500).json({ error: 'WC_URL not configured.' });

  try {
    const r = await pluginFetch(`/wp-json/vp-crm/v1/validate-coupon?code=${encodeURIComponent(code)}`);
    const data = await r.json();

    // Pass through exactly what the plugin returns
    return res.status(200).json(data);
  } catch (err) {
    console.error('[validate-coupon]', err);
    return res.status(500).json({ error: 'Could not reach store. Please try again.' });
  }
}
