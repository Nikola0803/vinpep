/**
 * useProducts — fetches the live WooCommerce catalog via /api/products.
 *
 * Module-level cache: data is fetched once per page load and reused
 * across all components that call this hook.
 */

import { useState, useEffect } from 'react';
import type { Product } from '@/mocks/products';

// ─── Module-level cache ───────────────────────────────────────────────────────
let cachedProducts: Product[] | null = null;
let inflightPromise: Promise<Product[]> | null = null;

function loadProducts(): Promise<Product[]> {
  if (inflightPromise) return inflightPromise;
  inflightPromise = fetch('/api/products')
    .then((r) => {
      if (!r.ok) throw new Error(`Products API returned ${r.status}`);
      return r.json() as Promise<Product[]>;
    })
    .then((data) => {
      cachedProducts = data;
      return data;
    })
    .catch((err) => {
      inflightPromise = null; // allow retry on next mount
      throw err;
    });
  return inflightPromise;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useProducts() {
  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [loading, setLoading]   = useState<boolean>(!cachedProducts);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return { products, loading, error };
}
