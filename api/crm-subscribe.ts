/**
 * POST /api/crm-subscribe
 * Body: { email: string; name?: string }
 *
 * Server-side proxy to WordPress vp-crm/v1/subscribe endpoint.
 * Keeps WC_URL server-only — no VITE_ env var needed on the frontend.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = process.env.WC_URL || process.env.VITE_WC_URL || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!WC_URL) {
    return res.status(500).json({ error: 'WC_URL not configured' });
  }

  const { email, name } = req.body ?? {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const tryFetch = async (url: string) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), name: name ?? '' }),
    signal: AbortSignal.timeout(8_000),
  });

  try {
    const base = WC_URL.replace(/\/$/, '');
    const path = '/wp-json/vp-crm/v1/subscribe';

    let wpRes: Response;
    try {
      wpRes = await tryFetch(base + path);
    } catch {
      // SSL or network error on primary URL — try HTTP fallback
      const httpBase = base.replace(/^https:\/\//, 'http://');
      wpRes = await tryFetch(httpBase + path);
    }

    const data = await wpRes.json().catch(() => ({}));

    if (!wpRes.ok) {
      return res.status(wpRes.status).json({ error: (data as { error?: string }).error ?? 'Subscription failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
