/**
 * /api/btc  — unified BTC handler
 *
 * GET  /api/btc?invoiceId=VTG-...
 *   Derives the next native-SegWit (bc1…) address from the operator's zpub.
 *   Replaces the old /api/btc-address endpoint.
 *
 * POST /api/btc  (BlockCypher webhook)
 *   Fires when a BTC transaction receives ≥1 confirmation on mainnet.
 *   Replaces the old /api/btc-payment-notify endpoint.
 *
 * Env vars (Vercel):
 *   WC_URL, WC_USER, WC_APP_PASSWORD, WC_KEY, WC_SECRET, BLOCKCYPHER_TOKEN
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HDKey } from '@scure/bip32';
import { p2wpkh } from '@scure/btc-signer';

const WC_URL          = process.env.WC_URL          || process.env.VITE_WC_URL    || '';
const WC_USER         = process.env.WC_USER         || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';
const WC_KEY          = process.env.WC_KEY          || process.env.VITE_WC_KEY   || '';
const WC_SECRET       = process.env.WC_SECRET       || process.env.VITE_WC_SECRET || '';

function wcAuth(): string {
  if (WC_USER && WC_APP_PASSWORD) {
    return 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64');
  }
  return 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
}

async function wpGet<T>(path: string): Promise<T> {
  const res = await fetch(`${WC_URL}/wp-json${path}`, {
    headers: { Authorization: wcAuth() },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`WP GET ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function wpPost(path: string, body: unknown): Promise<Response> {
  const res = await fetch(`${WC_URL}/wp-json${path}`, {
    method: 'POST',
    headers: { Authorization: wcAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
  return res;
}

// ── GET: derive BTC address ───────────────────────────────────────────────────

async function handleGetAddress(req: VercelRequest, res: VercelResponse) {
  const invoiceId = req.query.invoiceId as string | undefined;
  if (!invoiceId) {
    return res.status(400).json({ error: 'invoiceId query param required' });
  }

  const hasAuth = (WC_USER && WC_APP_PASSWORD) || (WC_KEY && WC_SECRET);
  if (!WC_URL || !hasAuth) {
    return res.status(500).json({ error: 'WooCommerce env vars not configured' });
  }

  try {
    const { index, zpub } = await wpGet<{ index: number; zpub: string }>(
      '/vp-btc/v1/next-index'
    );

    if (!zpub) {
      return res.status(503).json({ error: 'BTC zpub not configured in WP admin' });
    }

    const stripped = zpub.replace(/\s+/g, '');
    const keyMatch = stripped.match(/[zxy]pub[1-9A-HJ-NP-Za-km-z]{100,115}/);
    if (!keyMatch) throw new Error(`Invalid extended public key stored in WP (got: ${stripped.slice(0, 20)}…)`);
    const cleanKey = keyMatch[0];

    let versions: { public: number; private: number };
    if (cleanKey.startsWith('zpub')) {
      versions = { public: 0x04b24746, private: 0x04b2430c };
    } else if (cleanKey.startsWith('ypub')) {
      versions = { public: 0x049d7cb2, private: 0x049d7878 };
    } else {
      versions = { public: 0x0488b21e, private: 0x0488ade4 };
    }

    const hdKey   = HDKey.fromExtendedKey(cleanKey, versions);
    const child   = hdKey.deriveChild(0).deriveChild(index);
    if (!child.publicKey) throw new Error('HD derivation produced no public key');
    const address = p2wpkh(child.publicKey).address!;

    // Register BlockCypher webhook — points back to POST /api/btc
    const blockcypherToken = process.env.BLOCKCYPHER_TOKEN;
    if (blockcypherToken) {
      const proto = req.headers['x-forwarded-proto'] ?? 'https';
      const host  = req.headers.host;
      const webhookUrl = `${proto}://${host}/api/btc`;
      try {
        await fetch('https://api.blockcypher.com/v1/btc/main/hooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'confirmed-tx',
            address,
            url: webhookUrl,
            confirmations: 1,
            token: blockcypherToken,
          }),
          signal: AbortSignal.timeout(5_000),
        });
      } catch {
        console.warn('[btc] BlockCypher webhook registration failed');
      }
    }

    await wpPost('/vp-btc/v1/record-assignment', { invoiceId, address, index });

    return res.status(200).json({ address, index });
  } catch (err) {
    console.error('[btc/address]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}

// ── POST: BlockCypher payment notify ─────────────────────────────────────────

interface BlockCypherPayload {
  hash: string;
  addresses: string[];
  total: number;
  confirmations: number;
}

async function handlePaymentNotify(req: VercelRequest, res: VercelResponse) {
  const payload       = req.body as BlockCypherPayload;
  const txHash        = payload?.hash;
  const addresses     = payload?.addresses ?? [];
  const confirmations = payload?.confirmations ?? 0;
  const totalSats     = payload?.total ?? 0;

  if (!txHash || addresses.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  if (confirmations < 1) {
    return res.status(200).json({ status: 'unconfirmed — skipping' });
  }

  console.log(`[btc/notify] TX ${txHash} — addresses: ${addresses.join(', ')}, sats: ${totalSats}`);

  try {
    const lookupRes = await fetch(
      `${WC_URL}/wp-json/vp-btc/v1/order-by-address?address=${encodeURIComponent(addresses[0])}`,
      { headers: { Authorization: wcAuth() }, signal: AbortSignal.timeout(8_000) }
    );

    if (!lookupRes.ok) {
      return res.status(200).json({ status: 'order not found' });
    }

    const { orderId } = (await lookupRes.json()) as { orderId: number };
    if (!orderId) return res.status(200).json({ status: 'no matching order' });

    const btcAmount = (totalSats / 1e8).toFixed(8);
    const auth      = wcAuth();

    await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'processing',
        meta_data: [
          { key: 'btc_tx_hash',        value: txHash },
          { key: 'btc_confirmed_sats', value: String(totalSats) },
          { key: 'btc_confirmed_at',   value: new Date().toISOString() },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });

    await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}/notes`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note: `BTC payment confirmed.\nAmount: ${btcAmount} BTC (${totalSats} sats)\nTX: ${txHash}\nConfirmations: ${confirmations}`,
        customer_note: false,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    console.log(`[btc/notify] Order #${orderId} → processing`);
    return res.status(200).json({ status: 'ok', orderId, txHash });
  } catch (err) {
    console.error('[btc/notify]', err);
    return res.status(200).json({ status: 'error', error: err instanceof Error ? err.message : 'Internal error' });
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET')  return handleGetAddress(req, res);
  if (req.method === 'POST') return handlePaymentNotify(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}
