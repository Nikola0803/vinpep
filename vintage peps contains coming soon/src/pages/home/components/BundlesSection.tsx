import { useCart } from '../../../context/CartContext';
import { bundles } from '../../../mocks/bundles';

export default function BundlesSection() {
  const { addItem } = useCart();

  return (
    <section className="py-16 md:py-24 bg-espresso relative overflow-hidden">
      <div className="absolute inset-0 distressed-overlay opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-brass text-lg">❧</span>
          <h2 className="font-display text-xl md:text-2xl tracking-[0.2em] uppercase text-cream mt-3">
            Research Stacks
          </h2>
          <p className="font-body text-sm italic text-cream/60 mt-3 max-w-xl mx-auto">
            Curated combinations designed for specific research pathways. Save more when you stack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="border border-brass/40 bg-walnut/60 hover:border-brass hover:bg-walnut/80 transition-all duration-500 group p-6 md:p-8 flex flex-col"
            >
              <div className="mb-5">
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-brass">
                  Bundle
                </span>
                <h3 className="font-display text-sm tracking-[0.15em] uppercase text-cream mt-2">
                  {bundle.name}
                </h3>
              </div>

              <div className="brass-rule mb-5" />

              <div className="space-y-2 mb-5 flex-1">
                <p className="font-body text-xs text-cream/50 uppercase tracking-wider">
                  Includes:
                </p>
                <ul className="space-y-1.5">
                  {bundle.contents.map((item, i) => (
                    <li
                      key={i}
                      className="font-body text-sm italic text-cream/80 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brass/60 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-mono text-xl text-brass font-bold">
                  ${bundle.bundlePrice}
                </span>
                <span className="font-mono text-sm text-cream/40 line-through">
                  ${bundle.originalPrice}
                </span>
              </div>

              <p className="font-body text-xs text-brass mb-5">
                Save ${bundle.originalPrice - bundle.bundlePrice} ({bundle.savingsPct}%)
              </p>

              <button
                onClick={() =>
                  addItem({
                    id: bundle.id,
                    name: bundle.name,
                    peptideCode: bundle.contents.join(' + '),
                    price: bundle.bundlePrice,
                    dosage: 'Stack Bundle',
                  })
                }
                className="w-full bg-brass hover:bg-brass-light text-espresso font-display text-[11px] tracking-[0.2em] uppercase py-3 border border-brass transition-all duration-300 hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}