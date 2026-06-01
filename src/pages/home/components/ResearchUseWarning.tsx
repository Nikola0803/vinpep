export default function ResearchUseWarning() {
  return (
    <section className="bg-[#1e1208] border-t border-brass/40">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="w-7 h-7 flex items-center justify-center text-brass">
            <i className="ri-error-warning-line text-lg" />
          </span>
          <h2 className="font-display text-sm md:text-base tracking-[0.3em] uppercase text-brass">
            Research Use Only
          </h2>
          <span className="w-7 h-7 flex items-center justify-center text-brass">
            <i className="ri-error-warning-line text-lg" />
          </span>
        </div>

        <div className="brass-rule max-w-xs mx-auto mb-5" />

        <p className="font-body text-sm md:text-base text-cream/90 leading-relaxed max-w-3xl mx-auto">
          All products are intended solely for laboratory research and are not for human or animal
          consumption. By purchasing, the buyer agrees to use these products in compliance with all
          applicable laws. All products currently listed on this site are for research purposes{' '}
          <span className="text-brass font-bold uppercase tracking-wider">ONLY</span>.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-brass/60 rounded-full" />
          <span className="font-mono text-[10px] tracking-wider text-cream/50 uppercase">
            Must be 21+ to purchase
          </span>
          <span className="w-1.5 h-1.5 bg-brass/60 rounded-full" />
        </div>
      </div>
    </section>
  );
}