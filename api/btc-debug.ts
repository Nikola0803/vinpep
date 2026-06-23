/**
 * GET /api/btc-debug
 * Diagnostic endpoint — check env vars and WP connectivity.
 * REMOVE THIS FILE before going to production.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const WC_URL          = process.env.WC_URL          || process.env.VITE_WC_URL    || '';
  const WC_USER         = process.env.WC_USER         || '';
  const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';
  const WC_KEY          = process.env.WC_KEY          || process.env.VITE_WC_KEY    || '';
  const WC_SECRET       = process.env.WC_SECRET       || process.env.VITE_WC_SECRET || '';

  const hasAppPassword = !!(WC_USER && WC_APP_PASSWORD);
  const hasKeySecret   = !!(WC_KEY && WC_SECRET);

  const authHeader = hasAppPassword
    ? 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64')
    : hasKeySecret
    ? 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64')
    : null;

  const result: Record<string, unknown> = {
    env: {
      WC_URL:          WC_URL   ? WC_URL   : '❌ MISSING',
      WC_USER:         WC_USER  ? '✅ set'  : '❌ MISSING',
      WC_APP_PASSWORD: WC_APP_PASSWORD ? '✅ set' : '❌ MISSING',
      WC_KEY:          WC_KEY   ? '✅ set'  : '(not set)',
      WC_SECRET:       WC_SECRET ? '✅ set' : '(not set)',
      authMethod:      hasAppPassword ? 'Application Password' : hasKeySecret ? 'Consumer Key' : '❌ NO AUTH',
    },
  };

  if (!WC_URL || !authHeader) {
    return res.status(200).json({ ...result, wpTest: '⏭ skipped — missing env vars' });
  }

  // Test 1: WP root
  try {
    const r = await fetch(`${WC_URL}/wp-json`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(6_000),
    });
    result.wpRoot = `${r.status} ${r.ok ? '✅' : '❌'}`;
  } catch (e) {
    result.wpRoot = `❌ fetch error: ${e instanceof Error ? e.message : e}`;
  }

  // Test 2: vp-btc next-index endpoint
  try {
    const r = await fetch(`${WC_URL}/wp-json/vp-btc/v1/next-index`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(6_000),
    });
    const body = await r.text();
    result.vpBtcEndpoint = `${r.status} ${r.ok ? '✅' : '❌'} — ${body.slice(0, 200)}`;
  } catch (e) {
    result.vpBtcEndpoint = `❌ fetch error: ${e instanceof Error ? e.message : e}`;
  }

  // Test 3: scure imports
  try {
    const { HDKey } = await import('@scure/bip32');
    const { p2wpkh } = await import('@scure/btc-signer');
    result.scureImports = HDKey && p2wpkh ? '✅ loaded' : '❌ undefined export';
  } catch (e) {
    result.scureImports = `❌ import error: ${e instanceof Error ? e.message : e}`;
  }

  return res.status(200).json(result);
}
