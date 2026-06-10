export default function BrandStory() {
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-b from-espresso via-walnut to-espresso overflow-hidden">
      <div className="absolute inset-0 distressed-overlay opacity-30" />
      <div className="absolute inset-0 vignette-overlay" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <div className="w-24 h-24 rounded-full border-2 border-brass flex items-center justify-center mb-6 bg-espresso/50">
              <span className="font-display text-2xl text-brass tracking-widest">
                VP
              </span>
            </div>
            <div className="brass-rule w-24 mb-6" />
            <p className="font-body text-xs tracking-[0.15em] uppercase text-brass text-center lg:text-left">
              Est. 2024
            </p>
          </div>

          <div className="lg:col-span-8">
            <blockquote className="font-display text-xl md:text-2xl lg:text-3xl italic text-cream/90 leading-relaxed mb-8 text-balance">
              "Not a product. A pursuit."
            </blockquote>

            <div className="brass-rule max-w-md mb-8" />

            <div className="space-y-4">
              <p className="font-body text-sm text-cream/70 leading-relaxed">
                Vintage Peptides was founded by researchers who were tired of compromised compounds.
                We built this company around a single, non-negotiable principle:{' '}
                <strong className="text-cream">the integrity of your research depends on the
                integrity of your materials.</strong>
              </p>
              <p className="font-body text-sm text-cream/70 leading-relaxed">
                We do not chase trends. We do not cut corners. We synthesize, test, verify, and
                ship — with the meticulous care of a 19th-century apothecary and the analytical
                rigor of a modern laboratory. Every vial that leaves our facility carries not just
                a peptide sequence, but a promise.
              </p>
              <p className="font-body text-sm text-cream/70 leading-relaxed">
                Our founding team includes PhD-level peptide chemists, analytical method
                developers, and former clinical researchers who understand exactly what is at
                stake when a batch fails to meet specification. We have been there. We built this
                so you never have to be.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}