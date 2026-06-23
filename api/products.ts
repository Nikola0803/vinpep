/**
 * GET /api/products
 *
 * Server-side proxy for WooCommerce product catalog.
 * Fetches all published products + variations, maps them to the
 * frontend Product interface, and returns a flat array.
 *
 * Responses are edge-cached for 5 minutes (s-maxage=300).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL    = process.env.WC_URL    || process.env.VITE_WC_URL    || '';
const WC_USER   = process.env.WC_USER   || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';
const WC_KEY    = process.env.WC_KEY    || process.env.VITE_WC_KEY    || '';
const WC_SECRET = process.env.WC_SECRET || process.env.VITE_WC_SECRET || '';

function wcAuth(): string {
  if (WC_USER && WC_APP_PASSWORD) {
    return 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64');
  }
  return 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
}

function getMeta(metaData: any[], key: string): string {
  return metaData?.find((m: any) => m.key === key || m.key === `_${key}`)?.value ?? '';
}

function mapSubcategory(catName: string): string {
  const c = catName.toLowerCase();
  if (c.includes('blend'))                                return 'blends';
  if (c.includes('glp') || c.includes('glp-1'))          return 'glp';
  if (c.includes('metabolic') || c.includes('bioregul')) return 'metabolic';
  return 'peptides';
}

function mapCategory(catName: string): string {
  const sub = mapSubcategory(catName);
  if (sub === 'blends')   return 'blends';
  if (sub === 'metabolic') return 'bioregulators';
  return 'compounds';
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function flattenProducts(wcProducts: any[], variationsMap: Record<number, any[]>): any[] {
  const result: any[] = [];

  for (const p of wcProducts) {
    const meta       = p.meta_data ?? [];
    const peptideCode = getMeta(meta, 'peptide_code');
    const casNumber   = getMeta(meta, 'cas') || getMeta(meta, 'cas_number');
    const purity      = getMeta(meta, 'purity') || '≥99%';
    const hasCoa      = getMeta(meta, 'has_coa') === '1';
    const coaUrl      = getMeta(meta, 'coa_url') || '#';
    const testUrl     = getMeta(meta, 'test_url') || '#';
    const wcCat       = p.categories?.[0]?.name ?? '';
    const category    = mapCategory(wcCat);
    const subcategory = mapSubcategory(wcCat);
    const image       = p.images?.[0]?.src ?? '';
    const description = stripHtml(p.description);
    const rating      = parseFloat(p.average_rating ?? '5') || 5;
    const reviewCount = p.rating_count ?? 0;

    if (p.type === 'variable') {
      const variations = variationsMap[p.id] ?? [];
      for (const v of variations) {
        const dosageAttr = v.attributes?.find(
          (a: any) => a.name?.toLowerCase() === 'dosage'
        );
        const dosage     = dosageAttr?.option ?? '';
        const varMeta    = v.meta_data ?? [];
        const varHasCoa  = getMeta(varMeta, 'has_coa') === '1' || hasCoa;
        const price      = parseFloat(v.price || v.regular_price || '0');
        if (!price) continue; // skip unpublished variations

        result.push({
          id:             `${p.id}-${v.id}`,
          wcProductId:    p.id,
          wcVariationId:  v.id,
          sku:            v.sku || '',
          name:           p.name,
          peptideCode,
          casNumber,
          category,
          subcategory,
          purity,
          priceMin:       price,
          priceMax:       price,
          dosage,
          description,
          rating,
          reviewCount,
          stockCount:     v.stock_quantity ?? p.stock_quantity ?? 99,
          featured:       !!p.featured,
          popular:        false,
          hasCoa:         varHasCoa,
          coaUrl,
          testUrl,
          image,
        });
      }
    } else {
      // Simple product
      const dosageAttr = p.attributes?.find(
        (a: any) => a.name?.toLowerCase() === 'dosage'
      );
      const dosage = dosageAttr?.options?.[0] ?? '';
      const price  = parseFloat(p.price || p.regular_price || '0');
      if (!price) continue;

      result.push({
        id:             String(p.id),
        wcProductId:    p.id,
        wcVariationId:  null,
        sku:            p.sku || '',
        name:           p.name,
        peptideCode,
        casNumber,
        category,
        subcategory,
        purity,
        priceMin:       price,
        priceMax:       price,
        dosage,
        description,
        rating,
        reviewCount,
        stockCount:     p.stock_quantity ?? 99,
        featured:       !!p.featured,
        popular:        false,
        hasCoa,
        coaUrl,
        testUrl,
        image,
      });
    }
  }

  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!WC_URL) {
    return res.status(500).json({ error: 'WC_URL not configured' });
  }

  const headers = { Authorization: wcAuth(), 'Content-Type': 'application/json' };

  try {
    // 1. Fetch all published products (up to 100)
    const productsRes = await fetch(
      `${WC_URL}/wp-json/wc/v3/products?per_page=100&status=publish`,
      { headers, signal: AbortSignal.timeout(15_000) }
    );

    if (!productsRes.ok) {
      const text = await productsRes.text();
      return res.status(502).json({ error: `WC products fetch failed (${productsRes.status})`, detail: text });
    }

    const wcProducts: any[] = await productsRes.json();

    // 2. Fetch variations for all variable products in parallel
    const variableProducts = wcProducts.filter((p) => p.type === 'variable');
    const variationsMap: Record<number, any[]> = {};

    await Promise.all(
      variableProducts.map(async (p) => {
        try {
          const varRes = await fetch(
            `${WC_URL}/wp-json/wc/v3/products/${p.id}/variations?per_page=100`,
            { headers, signal: AbortSignal.timeout(10_000) }
          );
          if (varRes.ok) {
            variationsMap[p.id] = await varRes.json();
          }
        } catch {
          // Variation fetch failure is non-fatal — skip this product's variations
          variationsMap[p.id] = [];
        }
      })
    );

    // 3. Flatten + map
    const products = flattenProducts(wcProducts, variationsMap);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(products);
  } catch (err: any) {
    console.error('[api/products]', err);
    return res.status(500).json({ error: err.message || 'Unknown error fetching products' });
  }
}
