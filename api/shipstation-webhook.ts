/**
 * Vercel Serverless Function: /api/shipstation-webhook
 *
 * Receives ShipStation SHIP_NOTIFY webhooks, fetches shipment details,
 * updates WooCommerce order to Completed, injects tracking, and sends
 * SMTP shipping confirmation email via nodemailer.
 *
 * Required env vars (set in Vercel project settings):
 *   SS_API_KEY          ShipStation API Key
 *   SS_API_SECRET       ShipStation API Secret
 *   SS_WEBHOOK_SECRET   Shared secret set in ShipStation webhook config
 *   VITE_WC_URL         WordPress site URL (e.g. https://vintagepeptides.com)
 *   VITE_WC_KEY         WooCommerce consumer key
 *   VITE_WC_SECRET      WooCommerce consumer secret
 *   SMTP_HOST           e.g. smtp.sendgrid.net
 *   SMTP_PORT           e.g. 587
 *   SMTP_USER           SMTP username
 *   SMTP_PASS           SMTP password / API key
 *   SMTP_FROM           e.g. "Vintage Peptides <no-reply@vintagepeptides.com>"
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as crypto from 'node:crypto';
import * as nodemailer from 'nodemailer';

// ─── Config ───────────────────────────────────────────────────────────────────

const SS_KEY          = process.env.SS_API_KEY      || '';
const SS_SECRET       = process.env.SS_API_SECRET   || '';
const SS_WHK          = process.env.SS_WEBHOOK_SECRET || '';
const WC_URL          = process.env.WC_URL          || process.env.VITE_WC_URL    || '';
const WC_USER         = process.env.WC_USER         || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';
const WC_KEY          = process.env.WC_KEY          || process.env.VITE_WC_KEY   || '';
const WC_SEC          = process.env.WC_SECRET       || process.env.VITE_WC_SECRET || '';

function ssAuth() {
  return 'Basic ' + Buffer.from(`${SS_KEY}:${SS_SECRET}`).toString('base64');
}
function wcAuth() {
  if (WC_USER && WC_APP_PASSWORD) {
    return 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64');
  }
  return 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SEC}`).toString('base64');
}

// ─── SMTP transport (lazy init) ───────────────────────────────────────────────

function createMailer() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Validate webhook signature ────────────────────────────────────────────
  if (SS_WHK) {
    const signature  = req.headers['x-ss-signature'] as string || '';
    const rawBody    = JSON.stringify(req.body); // Vercel parses body; re-stringify for HMAC
    const expected   = crypto.createHmac('sha256', SS_WHK).update(rawBody).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature.padEnd(expected.length, ' ')))) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const { resource_url, resource_type } = req.body as { resource_url?: string; resource_type?: string };

  if (resource_type !== 'SHIP_NOTIFY' || !resource_url) {
    return res.status(200).json({ ok: true, note: 'ignored' });
  }

  // ── Fetch shipment details from ShipStation ───────────────────────────────
  const ssRes = await fetch(resource_url, {
    headers: { Authorization: ssAuth() },
  });

  if (!ssRes.ok) {
    return res.status(502).json({ error: `ShipStation fetch failed: ${ssRes.status}` });
  }

  const ssData  = await ssRes.json() as { shipments?: Shipment[] };
  const results: ProcessResult[] = [];

  for (const shipment of ssData.shipments ?? []) {
    const result = await processShipment(shipment);
    results.push(result);
  }

  return res.status(200).json({ ok: true, processed: results });
}

// ─── Process one shipment ─────────────────────────────────────────────────────

interface Shipment {
  shipmentId:     number;
  orderNumber:    string;
  trackingNumber: string;
  carrierCode:    string;
  serviceCode:    string;
  shipDate:       string;
}

interface ProcessResult {
  orderNumber: string;
  status:      string;
  wcId?:       number;
  tracking?:   string;
  error?:      string;
}

async function processShipment(shipment: Shipment): Promise<ProcessResult> {
  const { orderNumber, trackingNumber, carrierCode, serviceCode, shipmentId } = shipment;

  try {
    // ── Find WC order by invoice_id meta ─────────────────────────────────────
    const searchUrl = `${WC_URL}/wp-json/wc/v3/orders?meta_key=invoice_id&meta_value=${encodeURIComponent(orderNumber)}&per_page=1`;
    const wcSearch = await fetch(searchUrl, { headers: { Authorization: wcAuth() } });
    const orders: WcOrder[] = await wcSearch.json();

    if (!orders.length) {
      return { orderNumber, status: 'not_found' };
    }

    const order = orders[0];
    const wcOrderId = order.id;
    const carrierName = serviceCode || carrierCode;

    // ── Update WC order: status + tracking meta ───────────────────────────────
    await fetch(`${WC_URL}/wp-json/wc/v3/orders/${wcOrderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: wcAuth() },
      body: JSON.stringify({
        status: 'completed',
        meta_data: [
          { key: '_tracking_number',     value: trackingNumber },
          { key: '_tracking_carrier',    value: carrierCode },
          { key: '_tracking_carrier_name', value: carrierName },
          { key: '_ship_date',           value: shipment.shipDate },
          { key: '_ss_shipment_id',      value: String(shipmentId) },
        ],
      }),
    });

    // ── Add order note ────────────────────────────────────────────────────────
    await fetch(`${WC_URL}/wp-json/wc/v3/orders/${wcOrderId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: wcAuth() },
      body: JSON.stringify({
        note: `📦 Shipped via ${carrierName}. Tracking: ${trackingNumber} (SS shipment #${shipmentId})`,
        customer_note: false,
      }),
    });

    // ── Send shipping email ───────────────────────────────────────────────────
    await sendShippingEmail(order, trackingNumber, carrierName);

    return { orderNumber, status: 'completed', wcId: wcOrderId, tracking: trackingNumber };

  } catch (err) {
    console.error('[shipstation-webhook] processShipment error:', err);
    return { orderNumber, status: 'error', error: String(err) };
  }
}

// ─── WC order shape (minimal) ─────────────────────────────────────────────────

interface WcOrder {
  id:         number;
  order_key:  string;
  status:     string;
  billing:    { first_name: string; last_name: string; email: string; address_1: string; city: string; state: string; postcode: string };
  line_items: { id: number; name: string; quantity: number; subtotal: string }[];
  total:      string;
  meta_data:  { key: string; value: string }[];
}

function getMeta(order: WcOrder, key: string): string {
  return order.meta_data.find(m => m.key === key)?.value || '';
}

// ─── Shipping confirmation email ──────────────────────────────────────────────

async function sendShippingEmail(order: WcOrder, tracking: string, carrierName: string): Promise<void> {
  const to         = order.billing.email;
  const firstName  = order.billing.first_name;
  const invoiceId  = getMeta(order, 'invoice_id') || String(order.id);
  const memo       = getMeta(order, 'memo_code');
  const trackingUrl = buildTrackingUrl(carrierName, tracking);

  const itemsHtml = order.line_items
    .map(item =>
      `<tr>
        <td style="padding:8px 12px;font-family:monospace;font-size:13px;color:#2c1a0e;border-bottom:1px solid #e8dcc8;">
          ${escHtml(item.name)} &times; ${item.quantity}
        </td>
        <td style="padding:8px 12px;font-family:monospace;font-size:13px;color:#b8942a;font-weight:bold;text-align:right;border-bottom:1px solid #e8dcc8;">
          $${parseFloat(item.subtotal).toFixed(2)}
        </td>
      </tr>`
    ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Your order has shipped</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fdf8f0;border:1px solid #d4c4a0;">

    <tr>
      <td style="background:#1e0f02;padding:28px 40px;text-align:center;border-bottom:2px solid #b8942a;">
        <p style="margin:0;color:#b8942a;font-family:monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;">Vintage Peptides</p>
        <h1 style="margin:8px 0 0;color:#f5f0e8;font-family:'Georgia',serif;font-size:24px;letter-spacing:0.12em;font-weight:400;text-transform:uppercase;">Order Shipped</h1>
      </td>
    </tr>

    <tr>
      <td style="padding:36px 40px;">
        <p style="margin:0 0 16px;color:#2c1a0e;font-size:15px;line-height:1.6;">Hi ${escHtml(firstName)}, your research order is on its way.</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff9ee;border:1px solid #b8942a;margin-bottom:28px;">
          <tr><td style="padding:24px;text-align:center;">
            <p style="margin:0 0 6px;font-family:monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#7a5c2e;">Tracking Number</p>
            <p style="margin:0 0 4px;font-family:monospace;font-size:22px;color:#b8942a;font-weight:bold;letter-spacing:0.08em;">${escHtml(tracking)}</p>
            <p style="margin:0 0 16px;font-size:12px;color:#7a5c2e;">${escHtml(carrierName)}</p>
            <a href="${trackingUrl}" style="display:inline-block;background:#b8942a;color:#1e0f02;font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 28px;text-decoration:none;border:1px solid #b8942a;">
              Track Your Package
            </a>
          </td></tr>
        </table>

        <p style="margin:0 0 12px;font-family:monospace;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#7a5c2e;">Order Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8dcc8;margin-bottom:24px;">
          <tr style="background:#f5f0e8;">
            <th style="padding:8px 12px;font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7a5c2e;text-align:left;border-bottom:1px solid #e8dcc8;">Item</th>
            <th style="padding:8px 12px;font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7a5c2e;text-align:right;border-bottom:1px solid #e8dcc8;">Amount</th>
          </tr>
          ${itemsHtml}
          <tr>
            <td style="padding:10px 12px;font-family:monospace;font-size:12px;font-weight:bold;color:#2c1a0e;">Total</td>
            <td style="padding:10px 12px;font-family:monospace;font-size:14px;font-weight:bold;color:#b8942a;text-align:right;">$${parseFloat(order.total).toFixed(2)}</td>
          </tr>
        </table>

        <p style="margin:0;font-size:11px;color:#9c8060;line-height:1.6;border-top:1px dashed #d4c4a0;padding-top:20px;">
          These products are for laboratory research use only. Not for human consumption, injection, or therapeutic use.<br>
          Invoice: ${escHtml(invoiceId)}${memo ? ` &bull; Memo: ${escHtml(memo)}` : ''}
        </p>
      </td>
    </tr>

    <tr>
      <td style="background:#1e0f02;padding:20px 40px;text-align:center;border-top:2px solid #b8942a;">
        <p style="margin:0;font-family:monospace;font-size:10px;color:#7a5c2e;letter-spacing:0.2em;text-transform:uppercase;">
          vintagepeptides.com &bull; research@vintagepeptides.com
        </p>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body></html>`;

  const mailer = createMailer();
  await mailer.sendMail({
    from:    process.env.SMTP_FROM || 'Vintage Peptides <no-reply@vintagepeptides.com>',
    to,
    subject: `📦 Your Vintage Peptides order has shipped — ${invoiceId}`,
    html,
  });
}

function buildTrackingUrl(carrier: string, tracking: string): string {
  const c = carrier.toLowerCase();
  if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
  if (c.includes('ups'))  return `https://www.ups.com/track?tracknum=${tracking}`;
  if (c.includes('fedex'))return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
  if (c.includes('dhl'))  return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`;
  return `https://www.google.com/search?q=${encodeURIComponent(carrier + ' tracking ' + tracking)}`;
}

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
