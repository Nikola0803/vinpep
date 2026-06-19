/**
 * POST /api/cancel-order
 *
 * Server-side proxy for cancelling a WooCommerce order (e.g. when a manual
 * payment window expires unpaid). Mirrors create-order.ts — keeps the WC
 * REST consumer key/secret server-side only.
 *
 * Body: { orderId: number }
 *
 * Env vars required (Vercel):
 *   VITE_WC_URL    – WooCommerce / WordPress site URL
 *   VITE_WC_KEY    – WooCommerce REST consumer key
 *   VITE_WC_SECRET – WooCommerce REST consumer secret
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = process.env.VITE_WC_URL ?? '';
const WC_KEY = process.env.VITE_WC_KEY ?? '';
const WC_SECRET = process.env.VITE_WC_SECRET ?? '';

function wcAuth(): string {
  return 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!WC_URL || !WC_KEY || !WC_SECRET) {
    console.error('[cancel-order] WooCommerce env vars not configured');
    return res.status(500).json({ error: 'Order service not configured' });
  }

  const orderId = Number(req.body?.orderId);
  if (!orderId || !Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'Valid orderId required' });
  }

  try {
    const wcRes = await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: wcAuth(),
      },
      body: JSON.stringify({ status: 'cancelled' }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!wcRes.ok) {
      const err = await wcRes.json().catch(() => ({}));
      console.error('[cancel-order] WC error', wcRes.status, err);
      return res.status(502).json({
        error: (err as { message?: string })?.message || `WooCommerce error ${wcRes.status}`,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[cancel-order]', err);
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Order service timed out' : 'Internal error cancelling order',
    });
  }
}
