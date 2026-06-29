/**
 * POST /api/contact
 * Body: { name, email, institution?, message }
 *
 * 1. Saves email to WP CRM (source: contact-form)
 * 2. Sends admin notification email via WP
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = (process.env.WC_URL || process.env.VITE_WC_URL || '').replace(/\/$/, '');
const WC_USER = process.env.WC_USER || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';
const WC_KEY = process.env.WC_KEY || '';
const WC_SECRET = process.env.WC_SECRET || '';

function auth() {
  if (WC_USER && WC_APP_PASSWORD)
    return 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64');
  return 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
}

async function wpPost(path: string, body: unknown): Promise<Response> {
  const base = WC_URL.startsWith('https') ? WC_URL : WC_URL;
  try {
    return await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth() },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    // SSL fallback
    const http = base.replace(/^https:\/\//, 'http://');
    return fetch(http + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth() },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, institution, message } = req.body ?? {};

  if (!email || !String(email).includes('@'))
    return res.status(400).json({ error: 'Valid email required' });
  if (!message || String(message).trim().length < 5)
    return res.status(400).json({ error: 'Message required' });

  const errors: string[] = [];

  // 1. Save to CRM
  try {
    await wpPost('/wp-json/vp-crm/v1/subscribe', {
      email: String(email).trim(),
      name: String(name || '').trim(),
      source: 'contact-form',
    });
  } catch (e) {
    errors.push('crm: ' + (e instanceof Error ? e.message : String(e)));
  }

  // 2. Admin notification via WP
  try {
    await wpPost('/wp-json/vp-crm/v1/contact-notify', {
      name: String(name || '').trim(),
      email: String(email).trim(),
      institution: String(institution || '').trim(),
      message: String(message).trim(),
    });
  } catch (e) {
    errors.push('notify: ' + (e instanceof Error ? e.message : String(e)));
  }

  if (errors.length) console.warn('[contact]', errors);

  // Always return success to user — admin errors shouldn't block them
  return res.status(200).json({ success: true });
}
