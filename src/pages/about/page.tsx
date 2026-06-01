import PageLayout from '@/components/feature/PageLayout';

export default function About() {
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
              Vintage Peptides was founded in 2024 by a collective of peptide chemists, analytical 
              methodologists, and former clinical researchers who shared a common frustration: the 
              research peptide market had become a race to the bottom, where transparency was optional 
              and purity was negotiable.
            </p>
            <p className="font-body text-sm text-saddle leading-relaxed">
              We set out to build something different. A supplier that treats every vial as a commitment 
              to scientific integrity. Where batch testing is not a marketing checkbox but a non-negotiable 
              standard. Where researchers can trust the label without second-guessing the contents.
            </p>
            <p className="font-body text-sm text-saddle leading-relaxed">
              Our synthesis partners operate GMP-adjacent facilities in the United States. Every batch 
              is independently verified by third-party laboratories using HPLC, mass spectrometry, and 
              a full panel of analytical tests. We do not release anything below 99% purity. Ever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { value: '12,000+', label: 'Vials Shipped' },
              { value: '99.2%', label: 'Average Purity' },
              { value: '100%', label: 'Batch Tested' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 border border-brass/30 bg-cream/40">
                <p className="font-mono text-2xl text-brass font-bold mb-2">{stat.value}</p>
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="brass-rule max-w-md mx-auto mb-8" />

          <blockquote className="font-display text-lg md:text-xl italic text-espresso text-center leading-relaxed">
            "Not a product. A pursuit."
          </blockquote>
        </div>
      </div>
    </PageLayout>
  );
}