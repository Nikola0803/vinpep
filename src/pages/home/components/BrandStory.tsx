import { useSections } from '@/context/SectionsContext';

export default function BrandStory() {
  const { sections } = useSections();
  const s = sections.brand_story;

  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-b from-espresso via-walnut to-espresso overflow-hidden">
      <div className="absolute inset-0 distressed-overlay opacity-30" />
      <div className="absolute inset-0 vignette-overlay" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <img
              src={s.logo_url}
              alt="Vintage Peptides"
              className="h-24 w-auto object-contain mb-6"
            />
            <div className="brass-rule w-24 mb-6" />
            <p className="font-body text-xs tracking-[0.15em] uppercase text-brass text-center lg:text-left">
              {s.est_label}
            </p>
          </div>

          <div className="lg:col-span-8">
            <blockquote className="font-display text-xl md:text-2xl lg:text-3xl italic text-cream/90 leading-relaxed mb-8 text-balance">
              {s.blockquote}
            </blockquote>

            <div className="brass-rule max-w-md mb-8" />

            <div className="space-y-4">
              <p className="font-body text-sm text-cream/70 leading-relaxed">
                {s.paragraph1}
              </p>
              <p className="font-body text-sm text-cream/70 leading-relaxed">
                {s.paragraph2}
              </p>
              <p className="font-body text-sm text-cream/70 leading-relaxed">
                {s.paragraph3}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
