export default function HeroSection() {
  return (
    <section className="relative min-h-[92vh] md:min-h-[95vh] bg-gradient-to-br from-espresso via-walnut to-[#1e1208] overflow-hidden">
      <div className="absolute inset-0 distressed-overlay opacity-50" />
      <div className="absolute inset-0 vignette-overlay" />

      {/* Subtle brass light leaks */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brass/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-brass/3 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-12 md:pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* LEFT: Copy + CRO elements */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Urgency strip */}
            <div className="inline-flex items-center gap-2 bg-brass/10 border border-brass/40 px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-brass rounded-full animate-pulse" />
              <span className="font-mono text-[11px] tracking-wider text-brass uppercase">
                Batch #VP-2405 ships today — 12 remaining
              </span>
            </div>

            <div className="mb-4">
              <span className="text-brass text-xl">❧</span>
            </div>

            <p className="font-display text-xs md:text-sm tracking-[0.35em] uppercase text-brass mb-4 text-shadow-brass">
              Founded on Principle
            </p>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-[0.1em] uppercase text-cream leading-[1.1] mb-5 text-shadow-dark">
              Research Peptides
              <br />
              <span className="text-brass italic normal-case tracking-normal text-3xl md:text-4xl lg:text-5xl">
                forged in pursuit
              </span>
            </h1>

            <p className="font-body text-base md:text-lg italic text-cream/80 max-w-xl leading-relaxed mb-8">
              Uncompromising 99%+ HPLC purity. USA-Lyophilized. Every vial ships with a matched, dated COA. No shortcuts. No compromises.
            </p>

            {/* Trust badge row */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 mb-8">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center text-brass text-xs">
                  <i className="ri-shield-check-line" />
                </span>
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-cream/70">99%+ Purity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center text-brass text-xs">
                  <i className="ri-flask-line" />
                </span>
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-cream/70">USA Lab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center text-brass text-xs">
                  <i className="ri-file-list-3-line" />
                </span>
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-cream/70">Batch COA</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center text-brass text-xs">
                  <i className="ri-truck-line" />
                </span>
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-cream/70">Free Ship $200+</span>
              </div>
            </div>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-10">
              <a
                href="#catalog"
                className="inline-block bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.25em] uppercase px-10 md:px-14 py-4 border border-brass transition-all duration-300 hover:shadow-[0_0_30px_rgba(184,148,42,0.4)] whitespace-nowrap"
              >
                Explore the Catalog
              </a>
              <a
                href="#tests"
                className="inline-flex items-center gap-2 text-brass hover:text-cream font-display text-xs tracking-[0.2em] uppercase transition-colors whitespace-nowrap"
              >
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-microscope-line" />
                </span>
                View Testing Standards
              </a>
            </div>

            {/* Social proof numbers */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-10 border-t border-cream/10 pt-6">
              <div className="text-center lg:text-left">
                <p className="font-mono text-xl md:text-2xl text-brass font-bold">12,847</p>
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-cream/50 mt-1">Researchers Served</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-mono text-xl md:text-2xl text-brass font-bold">4.8</p>
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-cream/50 mt-1">Average Rating</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-mono text-xl md:text-2xl text-brass font-bold">99.2%</p>
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-cream/50 mt-1">Avg Batch Purity</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Dramatic hero vial image with floating badges */}
          <div className="relative w-full lg:w-[420px] xl:w-[480px] flex-shrink-0">
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto lg:max-w-none">
              {/* Outer brass frame */}
              <div className="absolute -inset-3 border border-brass/30 pointer-events-none" />
              <div className="absolute -inset-5 border border-brass/10 pointer-events-none" />

              <img
                src="http://db.vintagepeptides.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-23-2026-10_26_13-PM.png"
                alt="Premium amber peptide research vial"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 md:-right-8 bg-espresso border border-brass px-4 py-3 shadow-lg">
                <p className="font-mono text-xs text-brass font-bold">99.2%</p>
                <p className="font-display text-[9px] tracking-wider uppercase text-cream/60">HPLC Verified</p>
              </div>

              <div className="absolute -bottom-4 -left-4 md:-left-8 bg-brass px-4 py-3 shadow-lg">
                <p className="font-mono text-xs text-espresso font-bold">USA</p>
                <p className="font-display text-[9px] tracking-wider uppercase text-espresso/70">Lyophilized</p>
              </div>

              <div className="absolute top-1/2 -right-4 md:-right-10 bg-parchment border border-brass px-3 py-2 shadow-lg">
                <p className="font-mono text-[10px] text-espresso font-bold">COA</p>
                <p className="font-display text-[8px] tracking-wider uppercase text-saddle">Included</p>
              </div>

              {/* Vignette overlay on image */}
              <div className="absolute inset-0 ring-1 ring-inset ring-brass/20" />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}