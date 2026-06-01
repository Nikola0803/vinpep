export default function EditorialStrip() {
  return (
    <section className="py-16 md:py-24 parchment-grain">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="relative aspect-[4/3] lg:aspect-[4/3] overflow-hidden rounded-lg">
            <img
              src="https://readdy.ai/api/search-image?query=Vintage%20scientific%20laboratory%20workspace%20with%20brass%20microscope%2C%20aged%20leather%20journal%2C%20glass%20beakers%2C%20and%20testing%20equipment%20on%20dark%20wood%20desk%2C%20warm%20amber%20lighting%2C%20apothecary%20aesthetic%2C%20research%20and%20purity%20testing%20concept%2C%20highly%20detailed%20cinematic%20photography&width=600&height=450&seq=editorial-lab&orientation=landscape"
              alt="Vintage laboratory testing equipment"
              className="w-full h-full object-cover object-top"
            />
            {/* Soft fade into parchment on the right side */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-parchment/40" />
            {/* Soft bottom fade into the section below */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-parchment/30 to-transparent" />
          </div>

          <div>
            <span className="text-brass text-lg">❧</span>
            <h2 className="font-display text-lg md:text-xl tracking-[0.15em] uppercase text-espresso mt-3 mb-5 leading-tight">
              Purity Is the Baseline —<br />
              Release Standards Are the Difference
            </h2>

            <p className="font-body text-sm text-saddle leading-relaxed mb-5">
              Every Vintage Peptides batch undergoes a rigorous six-point analytical protocol before
              it ever reaches our cold storage. HPLC purity verification is merely the beginning.
            </p>

            <ul className="space-y-2.5 mb-6">
              {[
                'HPLC Purity Analysis (≥99%)',
                'Mass Spectrometry Identity Confirmation',
                'Endotoxin Screening (LAL Test)',
                'Residual Solvent Analysis (GC-MS)',
                'Heavy Metals Panel (ICP-MS)',
                'Sterility & Bioburden Testing',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 flex items-center justify-center text-brass flex-shrink-0 mt-0.5">
                    <i className="ri-check-line text-xs" />
                  </span>
                  <span className="font-body text-sm text-saddle">{item}</span>
                </li>
              ))}
            </ul>

            <div className="brass-rule max-w-xs mb-5" />

            <p className="font-body text-sm italic text-saddle/80 leading-relaxed">
              Our COAs are not marketing documents — they are complete analytical records, dated,
              signed, and matched to your specific lot number. We archive every result for five years.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}