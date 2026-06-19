/**
 * POST /api/btc-payment-notify
 *
 * BlockCypher webhook — fires when a BTC transaction to a monitored address
 * receives ≥1 confirmation on mainnet.
 *
 * On receipt:
 *  1. Looks up the WC order by the BTC address in wp_postmeta
 *  2. Updates the order status to "processing"
 *  3. Adds an order note with the TX hash and confirmed amount
 *
 * Env vars required (Vercel):
 *   VITE_WC_URL        – WordPress / WooCommerce root URL
 *   VITE_WC_KEY        – WooCommerce REST consumer key
 *   VITE_WC_SECRET     – WooCommerce REST consumer secret
 *   BLOCKCYPHER_TOKEN  – BlockCypher API token (for request verification)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL    = process.env.VITE_WC_URL    ?? '';
const WC_KEY    = process.env.VITE_WC_KEY    ?? '';
const WC_SECRET = process.env.VITE_WC_SECRET ?? '';

function wcAuth(): string {
  return 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
}

interface BlockCypherWebhookPayload {
  hash: string;
  addresses: string[];
  total: number;       // value in satoshis
  confirmations: number;
  outputs: Array<{ addresses: string[]; value: number }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // BlockCypher sends POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body as BlockCypherWebhookPayload;
  const txHash       = payload?.hash;
  const addresses    = payload?.addresses ?? [];
  const confirmations = payload?.confirmations ?? 0;
  const totalSats    = payload?.total ?? 0;

  if (!txHash || addresses.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Only process confirmed transactions (confirmations ≥ 1)
  if (confirmations < 1) {
    return res.status(200).json({ status: 'unconfirmed — skipping' });
  }

  console.log(`[btc-notify] TX ${txHash} confirmed — addresses: ${addresses.join(', ')}, sats: ${totalSats}`);

  // ── Find the WC order that has this BTC address in its meta ─────────────────
  //  Uses WP REST endpoint exposed by the vp-btc plugin
  try {
    const lookupRes = await fetch(
      `${WC_URL}/wp-json/vp-btc/v1/order-by-address?address=${encodeURIComponent(addresses[0])}`,
      {
        headers: { Authorization: wcAuth() },
        signal: AbortSignal.timeout(8_000),
      }
    );

    if (!lookupRes.ok) {
      const text = await lookupRes.text().catch(() => '');
      console.warn('[btc-notify] Order lookup failed:', lookupRes.status, text);
      // Return 200 to prevent BlockCypher from retrying
      return res.status(200).json({ status: 'order not found' });
    }

    const { orderId } = (await lookupRes.json()) as { orderId: number };
    if (!orderId) {
      return res.status(200).json({ status: 'no matching order' });
    }

    const btcAmount = (totalSats / 1e8).toFixed(8);

    // ── Update WC order status to "processing" ──────────────────────────────
    await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        Authorization: wcAuth(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'processing',
        meta_data: [
          { key: 'btc_tx_hash', value: txHash },
          { key: 'btc_confirmed_sats', value: String(totalSats) },
          { key: 'btc_confirmed_at', value: new Date().toISOString() },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });

    // ── Add order note ────────────────────────────────────────────────────────
    await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}/notes`, {
      method: 'POST',
      headers: {
        Authorization: wcAuth(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        note: `BTC payment confirmed on-chain.\nAmount: ${btcAmount} BTC (${totalSats} sats)\nTX: ${txHash}\nConfirmations: ${confirmations}`,
        customer_note: false,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    console.log(`[btc-notify] Order #${orderId} → processing (TX: ${txHash})`);
    return res.status(200).json({ status: 'ok', orderId, txHash });
  } catch (err) {
    console.error('[btc-notify]', err);
    // Return 200 — BlockCypher will retry on 5xx; we don't want duplicate processing
    return res.status(200).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}
