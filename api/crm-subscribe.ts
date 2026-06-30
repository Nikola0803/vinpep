/**
 * POST /api/crm-subscribe
 * Body: { email: string; name?: string }
 *
 * Server-side proxy to WordPress vp-crm/v1/subscribe endpoint.
 * Keeps WC_URL server-only — no VITE_ env var needed on the frontend.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = process.env.WC_URL || process.env.VITE_WC_URL || '';
const STOREFRONT = process.env.STOREFRONT || 'vintage';

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

  // Force HTTP — VPS has no SSL cert yet; server-side HTTP is fine (not mixed content)
  const base = WC_URL.replace(/\/$/, '').replace(/^https:\/\//, 'http://');
  const path = '/wp-json/vp-crm/v1/subscribe';

  const tryFetch = async (url: string) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), name: name ?? '', source: 'newsletter-popup', storefront: STOREFRONT }),
    signal: AbortSignal.timeout(8_000),
  });

  try {
    let wpRes: Response;
    try {
      wpRes = await tryFetch(base + path);
    } catch {
      wpRes = await tryFetch(base + path); // retry once
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
