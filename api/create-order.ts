/**
 * POST /api/create-order
 *
 * Server-side proxy for creating a WooCommerce order. Keeps the WC REST
 * consumer key/secret out of the browser bundle.
 *
 * Env vars required (Vercel dashboard → Settings → Environment Variables):
 *   WC_URL    – WooCommerce / WordPress site URL  (e.g. https://vintagepeptides.com)
 *   WC_KEY    – WooCommerce REST consumer key     (starts with ck_)
 *   WC_SECRET – WooCommerce REST consumer secret  (starts with cs_)
 *
 * Legacy aliases also accepted (VITE_WC_URL / VITE_WC_KEY / VITE_WC_SECRET).
 * Prefer the non-VITE_ names so Vite doesn't embed them in the client bundle.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Accept both prefixed and non-prefixed names so old deployments keep working
const WC_URL = process.env.WC_URL || process.env.VITE_WC_URL || '';
const WC_KEY = process.env.WC_KEY || process.env.VITE_WC_KEY || '';
const WC_SECRET = process.env.WC_SECRET || process.env.VITE_WC_SECRET || '';

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
    const missing = [!WC_URL && 'WC_URL', !WC_KEY && 'WC_KEY', !WC_SECRET && 'WC_SECRET'].filter(Boolean);
    console.error('[create-order] Missing env vars:', missing.join(', '));
    return res.status(500).json({ error: 'Order service not configured' });
  }

  if (!isValidPayload(req.body)) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }

  try {
    // AbortSignal.timeout is Node 17.3+ — use a manual controller as fallback
    let signal: AbortSignal | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    if (typeof AbortSignal.timeout === 'function') {
      signal = AbortSignal.timeout(10_000);
    } else {
      const controller = new AbortController();
      timeoutHandle = setTimeout(() => controller.abort(), 10_000);
      signal = controller.signal;
    }

    const wcRes = await fetch(`${WC_URL}/wp-json/wc/v3/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: wcAuth(),
      },
      body: JSON.stringify(req.body),
      signal,
    });
    if (timeoutHandle) clearTimeout(timeoutHandle);

    if (!wcRes.ok) {
      const errText = await wcRes.text().catch(() => '');
      let err: { message?: string; code?: string } = {};
      try { err = JSON.parse(errText); } catch { /* not JSON */ }
      console.error(`[create-order] WC HTTP ${wcRes.status}:`, err.code, err.message, errText.slice(0, 300));
      return res.status(502).json({
        error: err.message || `WooCommerce error ${wcRes.status}`,
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
