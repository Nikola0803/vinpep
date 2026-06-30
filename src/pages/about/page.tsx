import PageLayout from '@/components/feature/PageLayout';
import { useSections } from '@/context/SectionsContext';

export default function About() {
  const { sections } = useSections();
  const s = sections.about;

  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain">
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-espresso mt-3">
              About Vintage Peptides
            </h1>
          </div>

          <div className="space-y-6 mb-12">
            <p className="font-body text-sm text-saddle leading-relaxed">
              {s.paragraph1}
            </p>
            <p className="font-body text-sm text-saddle leading-relaxed">
              {s.paragraph2}
            </p>
            <p className="font-body text-sm text-saddle leading-relaxed">
              {s.paragraph3}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {s.stats.map((stat, i) => (
              <div key={i} className="text-center p-6 border border-brass/30 bg-cream/40">
                <p className="font-mono text-2xl text-brass font-bold mb-2">{stat.value}</p>
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="brass-rule max-w-md mx-auto mb-8" />

          <blockquote className="font-display text-lg md:text-xl italic text-espresso text-center leading-relaxed">
            {s.quote}
          </blockquote>
        </div>
      </div>
    </PageLayout>
  );
}
