/**
 * POST /api/create-order
 *
 * Server-side proxy for creating a WooCommerce order. Keeps the WC REST
 * consumer key/secret out of the browser bundle — the frontend used to call
 * WooCommerce directly with VITE_WC_KEY / VITE_WC_SECRET, which ships those
 * credentials to every visitor's JS. This endpoint holds the only copy.
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

interface WcLineItem {
  product_id?: number;
  name: string;
  quantity: number;
  price: string;
  subtotal: string;
  total: string;
  meta_data?: Array<{ key: string; value: string }>;
}

interface WcAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

interface CreateOrderPayload {
  payment_method: string;
  payment_method_title: string;
  billing: WcAddress;
  shipping: WcAddress;
  line_items: WcLineItem[];
  coupon_lines?: Array<{ code: string }>;
  meta_data: Array<{ key: string; value: string }>;
  status: 'pending';
}

// ── Basic payload validation ──────────────────────────────────────────────
// We don't trust the browser; reject anything malformed before it reaches WC.
function isValidPayload(body: unknown): body is CreateOrderPayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (typeof b.payment_method !== 'string' || !b.payment_method) return false;
  if (typeof b.payment_method_title !== 'string') return false;
  if (b.status !== 'pending') return false;
  if (!b.billing || typeof b.billing !== 'object') return false;
  if (!b.shipping || typeof b.shipping !== 'object') return false;
  if (!Array.isArray(b.line_items) || b.line_items.length === 0) return false;
  for (const item of b.line_items) {
    if (typeof item !== 'object' || item === null) return false;
    const li = item as Record<string, unknown>;
    if (typeof li.name !== 'string' || !li.name) return false;
    if (typeof li.quantity !== 'number' || li.quantity <= 0) return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!WC_URL || !WC_KEY || !WC_SECRET) {
    console.error('[create-order] WooCommerce env vars not configured');
    return res.status(500).json({ error: 'Order service not configured' });
  }

  if (!isValidPayload(req.body)) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }

  try {
    const wcRes = await fetch(`${WC_URL}/wp-json/wc/v3/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: wcAuth(),
      },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(10_000),
    });

    if (!wcRes.ok) {
      const err = await wcRes.json().catch(() => ({}));
      console.error('[create-order] WC error', wcRes.status, err);
      return res.status(502).json({
        error: (err as { message?: string })?.message || `WooCommerce error ${wcRes.status}`,
      });
    }

    const order = await wcRes.json();
    // Only return the fields the frontend actually needs — don't leak
    // the full WC order object (billing details, internal meta, etc.)
    // back through a response that could be logged or cached upstream.
    return res.status(200).json({
      id: order.id,
      order_key: order.order_key,
      status: order.status,
    });
  } catch (err) {
    console.error('[create-order]', err);
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Order service timed out' : 'Internal error creating order',
    });
  }
}
