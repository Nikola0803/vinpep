import { Link } from 'react-router-dom';
import { useSections } from '@/context/SectionsContext';

export default function CategoryTiles() {
  const { sections } = useSections();
  const categories = sections.categories.tiles;

  return (
    <section className="py-16 md:py-24 parchment-grain">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-brass text-lg">❧</span>
          <h2 className="font-display text-xl md:text-2xl tracking-[0.2em] uppercase text-espresso mt-3">
            Browse by Category
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {categories.map((cat, index) => (
            <Link
              key={index}
              to={cat.link}
              className="group relative overflow-hidden border border-brass/30 hover:border-brass transition-all duration-500 rounded-lg"
            >
              <div className="absolute inset-0 bg-espresso">
                <img
                  src="https://readdy.ai/api/search-image?query=Dark%20espresso%20brown%20aged%20parchment%20texture%20with%20subtle%20grain%20and%20warm%20amber%20highlights%2C%20vintage%20apothecary%20paper%20background%2C%20seamless%20organic%20surface%20detail%2C%20elegant%20dark%20warm%20tone&width=400&height=400&seq=cat-texture&orientation=squarish"
                  alt=""
                  className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                />
                {/* Soft vignette fade into edges */}
                <div className="absolute inset-0 bg-gradient-to-b from-espresso/40 via-transparent to-espresso/40" />
                <div className="absolute inset-0 bg-gradient-to-r from-espresso/30 via-transparent to-espresso/30" />
              </div>
              <div className="relative z-10 p-6 md:p-8 min-h-[280px] flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full border border-brass/60 flex items-center justify-center mb-5 group-hover:border-brass group-hover:bg-brass/10 transition-all duration-300">
                  <span className="w-7 h-7 flex items-center justify-center text-brass/80 group-hover:text-brass">
                    <i className={`${cat.icon} text-xl`} />
                  </span>
                </div>

                <h3 className="font-display text-sm tracking-[0.25em] uppercase text-cream mb-3">
                  {cat.name}
                </h3>

                <p className="font-body text-sm text-cream/60 leading-relaxed flex-1">
                  {cat.description}
                </p>

                <div className="mt-5 flex items-center gap-2 text-brass group-hover:text-brass-light transition-colors">
                  <span className="font-display text-[11px] tracking-[0.15em] uppercase">
                    View All
                  </span>
                  <span className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-arrow-right-line text-xs" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
