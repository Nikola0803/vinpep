import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';
import { products } from '@/mocks/products';
import ProductCard from '@/pages/home/components/ProductCard';

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Peptides', value: 'peptides' },
  { label: 'Blends', value: 'blends' },
  { label: 'GLP', value: 'glp' },
  { label: 'Metabolic', value: 'metabolic' },
];

export default function Shop() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';

  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  const filteredProducts = useMemo(() => {
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

    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.priceMin - b.priceMin);
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.priceMax - a.priceMax);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [activeFilter, sortBy, searchQuery]);

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
            {filteredProducts.length} products
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
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