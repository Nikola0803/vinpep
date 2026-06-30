import PageLayout from '@/components/feature/PageLayout';
import { useSections } from '@/context/SectionsContext';

export default function ResearchUsePolicy() {
  const { sections } = useSections();
  const s = sections.research_use_policy;

  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain">
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-espresso mt-3">
              Research Use Policy
            </h1>
          </div>

          {s.content ? (
            <div className="space-y-8">
              <div
                className="font-body text-sm text-saddle leading-relaxed"
                dangerouslySetInnerHTML={{ __html: s.content }}
              />
              <div className="p-6 border border-dashed border-brass/20 bg-cream/30 text-center">
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso/80 mb-2">
                  Effective Date
                </p>
                <p className="font-mono text-xs text-saddle">
                  {s.effective_date}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="p-6 border border-red-900/15 bg-red-900/[0.02]">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-red-900/60 mt-0.5">
                    <i className="ri-error-warning-line" />
                  </span>
                  <div>
                    <p className="font-display text-[11px] tracking-[0.2em] uppercase text-red-900/90 mb-2">
                      Important Notice
                    </p>
                    <p className="font-body text-sm text-saddle leading-relaxed">
                      All products and information provided by Vintage Peptides are intended for <strong className="text-espresso">laboratory research use only</strong>. These products are not for human consumption, injection, or medical use. They are not intended to diagnose, treat, cure, or prevent any disease or condition.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Age &amp; Eligibility Requirements
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  You must be <strong className="text-espresso">21 years of age or older</strong> to access, browse, or purchase from this website. By using this site, you confirm that you are a qualified researcher, aged 21 or older, and that you have the knowledge, training, and facilities necessary to handle research chemicals safely and in accordance with applicable laboratory protocols.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  Vintage Peptides reserves the right to refuse service, terminate accounts, or cancel orders at its sole discretion if we suspect that a user does not meet these eligibility requirements or intends to use our products for purposes other than lawful research.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Intended Use &amp; Restrictions
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  All products sold by Vintage Peptides are strictly for <strong className="text-espresso">in vitro research and laboratory experimentation</strong> in controlled settings. This includes, but is not limited to:
                </p>
                <ul className="space-y-2.5 ml-4">
                  {[
                    'Academic and institutional research',
                    'Pharmaceutical and biotech development',
                    'Analytical and reference standard studies',
                    'Cell culture and biochemical assay work',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-4 h-4 flex items-center justify-center text-brass mt-0.5 flex-shrink-0">
                        <i className="ri-checkbox-circle-line text-xs" />
                      </span>
                      <span className="font-body text-sm text-saddle">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  <strong className="text-espresso">Prohibited uses include:</strong> human or animal consumption, administration, injection, implantation, or any therapeutic, cosmetic, or recreational application. Misrepresentation of intended use during the purchasing process is a violation of this policy and may result in permanent account suspension.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Regulatory Compliance &amp; FDA Disclaimer
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  All statements and products on this website have <strong className="text-espresso">not been evaluated by the Food and Drug Administration (FDA)</strong>. No product sold by Vintage Peptides is approved for human use, nor are any claims made regarding safety, efficacy, or therapeutic benefit.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  Researchers are responsible for ensuring that their use of our products complies with all applicable local, state, and federal regulations. This includes, but is not limited to, proper storage, handling, documentation, and disposal of research chemicals in accordance with institutional and environmental guidelines.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  User Responsibility &amp; Liability
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  By purchasing from Vintage Peptides, you assume full responsibility for the lawful and appropriate use of all products. You agree to indemnify and hold harmless Vintage Peptides, its affiliates, suppliers, and partners from any claims, damages, or liabilities arising from misuse, mishandling, or unlawful application of any product purchased from this site.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  Vintage Peptides is not liable for any injury, loss, or damage resulting from improper use, storage, or handling of research chemicals. All product descriptions, protocols, and technical data are provided for informational purposes only and do not constitute usage instructions or medical advice.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Purchase Agreement &amp; Account Verification
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  By creating an account, logging in, or completing a purchase, you explicitly agree to the terms of this Research Use Policy. You confirm that:
                </p>
                <ul className="space-y-2.5 ml-4">
                  {[
                    'You are 21 years of age or older',
                    'You are a qualified researcher with appropriate training and facilities',
                    'You will use all products solely for lawful laboratory research',
                    'You understand the risks associated with handling research chemicals',
                    'You will not use any product for human or animal consumption',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-4 h-4 flex items-center justify-center text-brass mt-0.5 flex-shrink-0">
                        <i className="ri-checkbox-circle-line text-xs" />
                      </span>
                      <span className="font-body text-sm text-saddle">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  Vintage Peptides may require additional verification, including institutional affiliation or research credentials, before processing certain orders. We reserve the right to request documentation at any time to verify compliance with this policy.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Policy Updates &amp; Contact
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  This Research Use Policy may be updated periodically to reflect changes in regulations, industry standards, or company practices. The effective date of the current policy is {s.effective_date}. Continued use of the site following any updates constitutes acceptance of the revised terms.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  If you have questions about this policy or require clarification on any aspect of our research-use terms, please contact our research support team at <a href="mailto:research@vintagepeptides.com" className="text-brass hover:text-espresso transition-colors underline underline-offset-2">research@vintagepeptides.com</a>.
                </p>
              </div>

              <div className="p-6 border border-dashed border-brass/20 bg-cream/30 text-center">
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso/80 mb-2">
                  Effective Date
                </p>
                <p className="font-mono text-xs text-saddle">
                  {s.effective_date}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
