import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';
import type { Product } from '@/mocks/products';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/pages/home/components/ProductCard';

// Group flat product list by name so multi-dosage products appear as one card.
function groupProducts(list: Product[]): { primary: Product; variants: Product[] }[] {
  const byName = new Map<string, Product[]>();
  for (const p of list) {
    const arr = byName.get(p.name) ?? [];
    arr.push(p);
    byName.set(p.name, arr);
  }
  return Array.from(byName.values()).map((variants) => {
    const sorted = [...variants].sort((a, b) => a.priceMin - b.priceMin);
    return { primary: sorted[0], variants: sorted };
  });
}

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Peptides', value: 'peptides' },
  { label: 'Blends', value: 'blends' },
  { label: 'GLP', value: 'glp' },
  { label: 'Metabolic', value: 'metabolic' },
];

export default function Shop() {
  const { products, loading, error } = useProducts();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';

  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  const filteredGroups = useMemo(() => {
    let result = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.peptideCode.toLowerCase().includes(q) ||
          p.casNumber.toLowerCase().includes(q)
      );
    }

    if (categoryParam) {
      result = result.filter((p) => p.category === categoryParam);
    } else if (activeFilter !== 'all') {
      result = result.filter((p) => p.subcategory === activeFilter);
    }

    let groups = groupProducts(result);

    if (sortBy === 'price-low') {
      groups = [...groups].sort((a, b) => a.primary.priceMin - b.primary.priceMin);
    } else if (sortBy === 'price-high') {
      groups = [...groups].sort((a, b) => b.primary.priceMax - a.primary.priceMax);
    } else if (sortBy === 'rating') {
      groups = [...groups].sort((a, b) => b.primary.rating - a.primary.rating);
    }

    return groups;
  }, [activeFilter, sortBy, searchQuery, categoryParam]);

  return (
    <PageLayout>
      <div className="py-8 md:py-12 parchment-grain">
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            {/* Trust banner strip */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-6 pb-6 border-b border-brass/15">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 flex items-center justify-center text-brass text-xs">
                  <i className="ri-shield-check-line" />
                </span>
                <span className="font-display text-[9px] tracking-[0.2em] uppercase text-saddle">99%+ Purity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 flex items-center justify-center text-brass text-xs">
                  <i className="ri-flask-line" />
                </span>
                <span className="font-display text-[9px] tracking-[0.2em] uppercase text-saddle">USA Lyophilized</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 flex items-center justify-center text-brass text-xs">
                  <i className="ri-file-list-3-line" />
                </span>
                <span className="font-display text-[9px] tracking-[0.2em] uppercase text-saddle">Batch COA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 flex items-center justify-center text-brass text-xs">
                  <i className="ri-truck-line" />
                </span>
                <span className="font-display text-[9px] tracking-[0.2em] uppercase text-saddle">Free Ship $200+</span>
              </div>
            </div>

            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-xl md:text-2xl tracking-[0.2em] uppercase text-espresso mt-3">
              The Complete Catalog
            </h1>
            {searchQuery && (
              <p className="font-body text-sm italic text-saddle mt-2">
                Results for &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>

          {/* Filter + Sort bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-brass/20">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`font-display text-[10px] tracking-[0.2em] uppercase px-4 py-2 border transition-all duration-300 whitespace-nowrap ${
                    activeFilter === filter.value
                      ? 'bg-brass text-espresso border-brass'
                      : 'bg-transparent text-saddle border-brass/30 hover:border-brass hover:text-espresso'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-display text-[10px] tracking-wider uppercase text-saddle">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-parchment border border-brass/40 font-body text-xs text-espresso py-1.5 px-3 focus:outline-none focus:border-brass"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <p className="font-mono text-xs text-saddle mb-6">
            {loading ? 'Loading…' : `${filteredGroups.length} products`}
          </p>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border border-brass/20 bg-cream/40 h-80 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="font-mono text-sm text-red-800/70">Could not load products — {error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {filteredGroups.map(({ primary, variants }) => (
                <ProductCard key={primary.id} product={primary} variants={variants} />
              ))}
            </div>
          )}

          {filteredGroups.length === 0 && (
            <div className="text-center py-16">
              <span className="w-12 h-12 flex items-center justify-center text-brass/30 mx-auto mb-4">
                <i className="ri-search-line text-2xl" />
              </span>
              <p className="font-body text-sm italic text-saddle">
                No products match your criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}