/**
 * GET /api/coas?product={slug}   → single product's COA entries
 * GET /api/coas                  → all COA entries
 *
 * Proxies to WordPress REST endpoint vintage-peps/v1/coas (vintage-peps-cms plugin).
 * Runs server-side so WC_URL never leaks to the browser.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = process.env.WC_URL || process.env.VITE_WC_URL || '';
const WC_USER = process.env.WC_USER || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';
const WC_KEY = process.env.WC_KEY || process.env.VITE_WC_KEY || '';
const WC_SECRET = process.env.WC_SECRET || process.env.VITE_WC_SECRET || '';

function wcAuth(): string {
  if (WC_USER && WC_APP_PASSWORD) {
    return 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64');
  }
  return 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!WC_URL) {
    return res.status(500).json({ error: 'WC_URL not configured' });
  }

  try {
    const product = req.query.product as string | undefined;
    const qs = product ? `?product=${encodeURIComponent(product)}` : '';
    const url = `${WC_URL.replace(/\/$/, '')}/wp-json/vintage-peps/v1/coas${qs}`;

    const wpRes = await fetch(url, {
      headers: {
        Authorization: wcAuth(),
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!wpRes.ok) {
      const text = await wpRes.text().catch(() => '');
      return res.status(wpRes.status).json({ error: `WP error ${wpRes.status}`, detail: text });
    }

    const data = await wpRes.json();

    // Cache for 5 minutes — COAs change infrequently
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
