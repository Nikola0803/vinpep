import { useSections } from '@/context/SectionsContext';

export default function ResearchUseWarning() {
  const { sections } = useSections();
  const s = sections.research_warning;

  return (
    <section className="bg-[#1e1208] border-t border-brass/40">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="w-7 h-7 flex items-center justify-center text-brass">
            <i className="ri-error-warning-line text-lg" />
          </span>
          <h2 className="font-display text-sm md:text-base tracking-[0.3em] uppercase text-brass">
            {s.heading}
          </h2>
          <span className="w-7 h-7 flex items-center justify-center text-brass">
            <i className="ri-error-warning-line text-lg" />
          </span>
        </div>

        <div className="brass-rule max-w-xs mx-auto mb-5" />

        <p className="font-body text-sm md:text-base text-cream/90 leading-relaxed max-w-3xl mx-auto">
          {s.body}
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-brass/60 rounded-full" />
          <span className="font-mono text-[10px] tracking-wider text-cream/50 uppercase">
            {s.age_notice}
          </span>
          <span className="w-1.5 h-1.5 bg-brass/60 rounded-full" />
        </div>
      </div>
    </section>
  );
}
