import { useSections } from '@/context/SectionsContext';

export default function TrustPillars() {
  const { sections } = useSections();
  const pillars = sections.trust_pillars.pillars;

  return (
    <section className="py-16 md:py-20 bg-cream bg-cream-grain">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {pillars.map((pillar, index) => (
            <div key={index} className="text-center group">
              <div className="mx-auto w-16 h-16 rounded-full border border-brass flex items-center justify-center mb-5 group-hover:bg-brass/10 transition-colors duration-300">
                <span className="w-7 h-7 flex items-center justify-center text-brass">
                  <i className={`${pillar.icon} text-lg`} />
                </span>
              </div>
              <h3 className="font-display text-xs tracking-[0.25em] uppercase text-espresso mb-3">
                {pillar.title}
              </h3>
              <p className="font-body text-sm text-saddle leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
