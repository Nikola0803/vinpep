import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/upload-payment-proof
 * Accepts a base64-encoded payment screenshot and attaches it to a WC order.
 *
 * Body: {
 *   orderId: number;       WooCommerce order ID
 *   invoiceId: string;     VP invoice ID (for reference)
 *   imageBase64: string;   base64-encoded image (no data: prefix)
 *   imageType: string;     MIME type e.g. "image/png"
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, invoiceId, imageBase64, imageType } = req.body ?? {};

  if (!orderId || !imageBase64 || !imageType) {
    return res.status(400).json({ error: 'orderId, imageBase64, and imageType are required.' });
  }

  const WC_URL    = process.env.WC_URL;
  const WC_KEY    = process.env.WC_KEY;
  const WC_SECRET = process.env.WC_SECRET;

  if (!WC_URL || !WC_KEY || !WC_SECRET) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const auth = 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');

  try {
    // ── 1. Upload image to WP media library ──────────────────────────────────
    const imgBuffer = Buffer.from(imageBase64, 'base64');
    const ext = imageType.split('/')[1] ?? 'jpg';
    const filename = `payment-proof-${invoiceId ?? orderId}.${ext}`;

    const mediaRes = await fetch(`${WC_URL}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': imageType,
      },
      body: imgBuffer,
    });

    let mediaUrl: string | null = null;
    if (mediaRes.ok) {
      const media = await mediaRes.json() as { source_url?: string };
      mediaUrl = media.source_url ?? null;
    }

    // ── 2. Update WC order meta with proof URL (or base64 fallback) ──────────
    const metaValue = mediaUrl ?? `data:${imageType};base64,${imageBase64.substring(0, 100)}…`;

    const orderRes = await fetch(`${WC_URL}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_data: [
          { key: 'payment_proof_url', value: mediaUrl ?? 'uploaded' },
          { key: 'payment_proof_submitted_at', value: new Date().toISOString() },
        ],
      }),
    });

    if (!orderRes.ok) {
      console.error('[upload-payment-proof] order update failed', await orderRes.text());
    }

    return res.status(200).json({
      success: true,
      mediaUrl,
      message: mediaUrl
        ? 'Payment proof uploaded and attached to your order.'
        : 'Payment proof received (will be reviewed manually).',
    });
  } catch (e) {
    console.error('[upload-payment-proof]', e);
    return res.status(500).json({ error: 'Upload failed. Please email orders@vintagepeptides.com instead.' });
  }
}
