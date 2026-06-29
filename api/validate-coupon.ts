/**
 * GET /api/validate-coupon?code=SHIP10
 *
 * Validates a coupon code against WooCommerce and returns discount details.
 * Keeps WC credentials server-side.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL          = (process.env.WC_URL || process.env.VITE_WC_URL || '').replace(/\/$/, '');
const WC_USER         = process.env.WC_USER || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';
const WC_KEY          = process.env.WC_KEY  || process.env.VITE_WC_KEY    || '';
const WC_SECRET       = process.env.WC_SECRET || process.env.VITE_WC_SECRET || '';

function wcAuth(): string {
  if (WC_USER && WC_APP_PASSWORD)
    return 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64');
  return 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
}

async function wcFetch(path: string): Promise<Response> {
  const base = WC_URL;
  try {
    return await fetch(base + path, {
      headers: { Authorization: wcAuth() },
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    // HTTP fallback (VPS has no SSL yet)
    const http = base.replace(/^https:\/\//, 'http://');
    return fetch(http + path, {
      headers: { Authorization: wcAuth() },
      signal: AbortSignal.timeout(8_000),
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const code = String(req.query.code ?? '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'code param required' });

  try {
    // WC REST: search coupons by code
    const r = await wcFetch(`/wp-json/wc/v3/coupons?code=${encodeURIComponent(code)}&per_page=1`);

    if (!r.ok) {
      const text = await r.text().catch(() => r.statusText);
      console.error('[validate-coupon] WC error:', r.status, text);
      return res.status(502).json({ error: 'Could not reach store.' });
    }

    const coupons = await r.json() as WcCoupon[];

    if (!coupons.length) {
      return res.status(404).json({ valid: false, error: 'Invalid or expired coupon code.' });
    }

    const c = coupons[0];

    // Check usage limit
    if (c.usage_limit && c.usage_count >= c.usage_limit) {
      return res.status(200).json({ valid: false, error: 'This coupon has reached its usage limit.' });
    }

    // Check expiry
    if (c.date_expires && new Date(c.date_expires) < new Date()) {
      return res.status(200).json({ valid: false, error: 'This coupon has expired.' });
    }

    // Map WC discount_type to our format
    let type: 'percent' | 'flat' | 'free_shipping';
    if (c.discount_type === 'percent') {
      type = 'percent';
    } else if (c.discount_type === 'fixed_cart' || c.discount_type === 'fixed_product') {
      type = 'flat';
    } else if (c.discount_type === 'free_shipping') {
      type = 'free_shipping';
    } else {
      type = 'flat';
    }

    return res.status(200).json({
      valid: true,
      code: c.code.toUpperCase(),
      type,
      value: parseFloat(c.amount) || 0,
      freeShipping: c.free_shipping || type === 'free_shipping',
      label: buildLabel(type, c.amount, c.free_shipping),
    });

  } catch (err) {
    console.error('[validate-coupon]', err);
    return res.status(500).json({ error: 'Internal error validating coupon.' });
  }
}

function buildLabel(type: string, amount: string, freeShipping: boolean): string {
  const parts: string[] = [];
  if (type === 'percent') parts.push(`${amount}% off`);
  else if (type === 'flat') parts.push(`$${amount} off`);
  if (freeShipping) parts.push('free shipping');
  return parts.join(' + ') || 'Discount applied';
}

interface WcCoupon {
  id: number;
  code: string;
  amount: string;
  discount_type: 'percent' | 'fixed_cart' | 'fixed_product' | 'free_shipping';
  free_shipping: boolean;
  date_expires: string | null;
  usage_count: number;
  usage_limit: number | null;
}
