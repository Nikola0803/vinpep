import type { VercelRequest, VercelResponse } from '@vercel/node';
// Debug endpoint disabled — remove this file entirely before going live.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(404).json({ error: 'Not found' });
}
