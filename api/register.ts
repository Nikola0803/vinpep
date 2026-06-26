import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/register
 * Creates a WooCommerce customer account.
 * Body: { email, password, firstName, lastName?, institution? }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, firstName, lastName = '', institution = '' } = req.body ?? {};

  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }
  if (!firstName?.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const WC_URL = process.env.WC_URL;
  const WC_KEY = process.env.WC_KEY;
  const WC_SECRET = process.env.WC_SECRET;

  if (!WC_URL || !WC_KEY || !WC_SECRET) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const r = await fetch(`${WC_URL}/wp-json/wc/v3/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64'),
      },
      body: JSON.stringify({
        email: String(email).trim().toLowerCase(),
        password,
        first_name: String(firstName).trim(),
        last_name: String(lastName).trim(),
        username: String(email).trim().toLowerCase(),
        meta_data: institution
          ? [{ key: 'institution', value: String(institution).trim() }]
          : [],
      }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      // WC returns code: "registration-error-email-exists" etc.
      const msg: string =
        err?.message ||
        (err?.code === 'registration-error-email-exists'
          ? 'An account with this email already exists.'
          : 'Registration failed. Please try again.');
      return res.status(400).json({ error: msg });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('[register]', e);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}
