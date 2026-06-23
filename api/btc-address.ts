/**
 * GET /api/btc-address?invoiceId=VTG-...
 *
 * Derives the next unused native-SegWit (bc1...) BTC receive address from the
 * operator's zpub stored in WordPress options. The derivation index is stored
 * and atomically incremented server-side so each order gets a unique address.
 *
 * Env vars required (Vercel):
 *   WC_URL          – WordPress site URL (e.g. https://db.vintagepeptides.com)
 *   WC_USER         – WordPress username (Application Password auth, preferred)
 *   WC_APP_PASSWORD – WordPress Application Password
 *   WC_KEY          – WooCommerce consumer key (fallback)
 *   WC_SECRET       – WooCommerce consumer secret (fallback)
 *
 * WP REST endpoints consumed:
 *   GET  /wp-json/vp-btc/v1/next-index          → { index, address, zpub }
 *   POST /wp-json/vp-btc/v1/record-assignment    → saves invoiceId → address
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HDKey } from '@scure/bip32';
import { p2wpkh } from '@scure/btc-signer';

const WC_URL        = process.env.WC_URL        || process.env.VITE_WC_URL    || '';
const WC_USER       = process.env.WC_USER       || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';
const WC_KEY        = process.env.WC_KEY        || process.env.VITE_WC_KEY   || '';
const WC_SECRET     = process.env.WC_SECRET     || process.env.VITE_WC_SECRET || '';

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

async function wpPost(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${WC_URL}/wp-json${path}`, {
    method: 'POST',
    headers: { Authorization: wcAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`WP POST ${path} → ${res.status}: ${text}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const invoiceId = req.query.invoiceId as string | undefined;
  if (!invoiceId) {
    return res.status(400).json({ error: 'invoiceId query param required' });
  }

  const hasAuth = (WC_USER && WC_APP_PASSWORD) || (WC_KEY && WC_SECRET);
  if (!WC_URL || !hasAuth) {
    return res.status(500).json({ error: 'WooCommerce env vars not configured (need WC_URL + WC_USER/WC_APP_PASSWORD or WC_KEY/WC_SECRET)' });
  }

  try {
    // ── 1. Ask WP for the next derivation index (atomically incremented) ─────
    const { index, zpub } = await wpGet<{ index: number; zpub: string }>(
      '/vp-btc/v1/next-index'
    );

    if (!zpub) {
      return res.status(503).json({ error: 'BTC zpub not configured in WP admin' });
    }

    // ── 2. Derive native SegWit (bc1...) address from zpub + index ───────────
    // zpub uses BIP84 version bytes (0x04b24746). @scure/bip32 accepts custom versions.
    const ZPUB_VERSIONS = { public: 0x04b24746, private: 0x04b2430c };
    const hdKey = HDKey.fromExtendedKey(zpub, ZPUB_VERSIONS);
    const child = hdKey.deriveChild(0).deriveChild(index); // m/0/{index} — external chain
    if (!child.publicKey) throw new Error('HD derivation produced no public key');
    const address: string = p2wpkh(child.publicKey).address!;

    // ── 3. Register this address with BlockCypher for payment monitoring ──────
    const webhookUrl = `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}/api/btc-payment-notify`;
    const blockcypherToken = process.env.BLOCKCYPHER_TOKEN;
    if (blockcypherToken) {
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
        // Non-fatal — order still placed; admin can manually verify
        console.warn('[btc-address] BlockCypher webhook registration failed');
      }
    }

    // ── 4. Record invoiceId → address mapping in WP ──────────────────────────
    await wpPost('/vp-btc/v1/record-assignment', { invoiceId, address, index });

    return res.status(200).json({ address, index });
  } catch (err) {
    console.error('[btc-address]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}
