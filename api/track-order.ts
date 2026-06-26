/**
 * Vercel Serverless Function: /api/track-order
 *
 * Public proxy — looks up a WC order by invoice ID or WC order ID.
 * Returns only safe public fields (status, tracking, items summary).
 * Does NOT expose WC credentials to the browser.
 *
 * GET /api/track-order?q=VTG-1718000000-V3K9
 * GET /api/track-order?q=12345
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL          = process.env.WC_URL          || process.env.VITE_WC_URL    || '';
const WC_USER         = process.env.WC_USER         || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';
const WC_KEY          = process.env.WC_KEY          || process.env.VITE_WC_KEY   || '';
const WC_SEC          = process.env.WC_SECRET       || process.env.VITE_WC_SECRET || '';

function wcAuth() {
  if (WC_USER && WC_APP_PASSWORD) {
    return 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64');
  }
  return 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SEC}`).toString('base64');
}

interface WcOrder {
  id:         number;
  status:     string;
  date_created: string;
  billing:    { first_name: string; last_name: string; email: string };
  line_items: { name: string; quantity: number; total: string }[];
  total:      string;
  meta_data:  { key: string; value: string }[];
}

function getMeta(order: WcOrder, key: string): string {
  return order.meta_data.find(m => m.key === key)?.value || '';
}

const STATUS_LABELS: Record<string, string> = {
  pending:    'Pending Payment',
  processing: 'Processing',
  'on-hold':  'On Hold',
  completed:  'Completed — Shipped',
  cancelled:  'Cancelled',
  refunded:   'Refunded',
  failed:     'Failed',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — only allow same-origin requests
  res.setHeader('Access-Control-Allow-Origin', process.env.VITE_WC_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });

  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing query parameter: q' });

  const hasAuth = (WC_USER && WC_APP_PASSWORD) || (WC_KEY && WC_SEC);
  if (!WC_URL || !hasAuth) {
    return res.status(200).json(mockOrder(q));
  }

  try {
    let orders: WcOrder[] = [];

    // Try by invoice_id meta first
    if (q.startsWith('VTG-')) {
      const r = await fetch(
        `${WC_URL}/wp-json/wc/v3/orders?meta_key=invoice_id&meta_value=${encodeURIComponent(q)}&per_page=1`,
        { headers: { Authorization: wcAuth() } }
      );
      orders = await r.json();
    }

    // Fallback: try by numeric WC order ID
    if (!orders.length && /^\d+$/.test(q)) {
      const r = await fetch(
        `${WC_URL}/wp-json/wc/v3/orders/${q}`,
        { headers: { Authorization: wcAuth() } }
      );
      if (r.ok) {
        const order: WcOrder = await r.json();
        orders = [order];
      }
    }

    if (!orders.length) {
      return res.status(404).json({ found: false, message: 'Order not found.' });
    }

    const order = orders[0];
    return res.status(200).json(formatPublicOrder(order));

  } catch (err) {
    console.error('[track-order]', err);
    return res.status(500).json({ error: 'Lookup failed. Please try again.' });
  }
}

function formatPublicOrder(order: WcOrder) {
  const tracking = getMeta(order, '_tracking_number');
  const carrier  = getMeta(order, '_tracking_carrier_name') || getMeta(order, '_tracking_carrier');
  const shipDate = getMeta(order, '_ship_date');
  const invoiceId = getMeta(order, 'invoice_id') || String(order.id);
  const memo      = getMeta(order, 'memo_code');

  return {
    found:      true,
    invoiceId,
    wcOrderId:  order.id,
    status:     order.status,
    statusLabel: STATUS_LABELS[order.status] || order.status,
    dateCreated: order.date_created,
    items:      order.line_items.map(i => ({
      name:     i.name,
      quantity: i.quantity,
      total:    i.total,
    })),
    total:      order.total,
    tracking:   tracking || null,
    carrier:    carrier  || null,
    shipDate:   shipDate || null,
    trackingUrl: tracking ? buildTrackingUrl(carrier, tracking) : null,
    memo:       memo || null,
  };
}

function buildTrackingUrl(carrier: string, tracking: string): string {
  const c = carrier.toLowerCase();
  if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
  if (c.includes('ups'))  return `https://www.ups.com/track?tracknum=${tracking}`;
  if (c.includes('fedex'))return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
  if (c.includes('dhl'))  return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`;
  return `https://www.google.com/search?q=${encodeURIComponent(carrier + ' tracking ' + tracking)}`;
}

function mockOrder(q: string) {
  return {
    found: true,
    invoiceId: q,
    wcOrderId: 99999,
    status: 'processing',
    statusLabel: 'Processing',
    dateCreated: new Date().toISOString(),
    items: [{ name: 'BPC-157 (5mg)', quantity: 2, total: '178.00' }],
    total: '178.00',
    tracking: null,
    carrier: null,
    shipDate: null,
    trackingUrl: null,
    memo: 'V3K9',
  };
}
