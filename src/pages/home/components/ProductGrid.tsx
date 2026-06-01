import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../../../mocks/products';
import ProductCard from './ProductCard';

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Peptides', value: 'peptides' },
  { label: 'Blends', value: 'blends' },
  { label: 'GLP', value: 'glp' },
  { label: 'Metabolic', value: 'metabolic' },
];

export default function ProductGrid() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return products;
    return products.filter((p) => p.subcategory === activeFilter);
  }, [activeFilter]);

  return (
    <section id="catalog" className="py-16 md:py-24 parchment-grain">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <span className="text-brass text-lg">❧</span>
          <h2 className="font-display text-xl md:text-2xl tracking-[0.2em] uppercase text-espresso mt-3">
            The Catalog
          </h2>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`font-display text-[11px] tracking-[0.2em] uppercase px-5 py-2 border transition-all duration-300 whitespace-nowrap ${
                activeFilter === filter.value
                  ? 'bg-brass text-espresso border-brass'
                  : 'bg-transparent text-saddle border-brass/30 hover:border-brass hover:text-espresso'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Product grid — max 8 on homepage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {filteredProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length > 8 && (
          <div className="text-center mt-10">
            <p className="font-mono text-xs text-saddle mb-4">
              Showing 8 of {filteredProducts.length} products
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-espresso text-cream font-display text-xs tracking-[0.2em] uppercase px-8 py-3.5 border border-espresso hover:bg-brass hover:text-espresso hover:border-brass transition-all duration-300"
            >
              View Complete Catalogue
              <span className="w-4 h-4 flex items-center justify-center">
                <i className="ri-arrow-right-line text-xs" />
              </span>
            </Link>
          </div>
        )}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="font-body text-sm italic text-saddle">
              No products found in this category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}