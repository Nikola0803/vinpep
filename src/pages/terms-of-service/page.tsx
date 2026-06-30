import PageLayout from '@/components/feature/PageLayout';
import { useSections } from '@/context/SectionsContext';

export default function TermsOfService() {
  const { sections } = useSections();
  const s = sections.terms_of_service;

  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain">
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-espresso mt-3">
              Terms of Service
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
                  Last Updated
                </p>
                <p className="font-mono text-xs text-saddle">
                  {s.effective_date}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Agreement to Terms
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  By accessing or using the Vintage Peptides website ("Site"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not access or use the Site. These Terms constitute a legally binding agreement between you and Vintage Peptides, LLC ("Vintage Peptides," "we," "us," or "our").
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Site following any changes constitutes acceptance of the revised Terms.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Eligibility & Account Registration
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  You must be <strong className="text-espresso">at least 21 years of age</strong> to create an account, browse product listings, or make purchases on this Site. By registering, you represent and warrant that you are a qualified researcher with the necessary training, facilities, and institutional affiliation to handle research chemicals lawfully.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use or security breach. Vintage Peptides reserves the right to suspend or terminate accounts at its sole discretion.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Products & Orders
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  All products listed on the Site are strictly for <strong className="text-espresso">laboratory research use only</strong>. They are not intended for human or animal consumption, injection, or therapeutic application. Product descriptions, specifications, and analytical data are provided for informational purposes only.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including but not limited to: suspected misuse, inability to verify buyer identity, product unavailability, or pricing errors. Prices are subject to change without notice.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  Payment must be received before orders are processed. We accept Zelle, Cash App, and Venmo as payment methods. All transactions are final unless covered by our Return Policy.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Shipping & Delivery
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  We ship domestically within the United States only. All orders are packaged with temperature-controlled materials including cold packs and insulated liners to maintain product stability during transit.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  Orders placed before 2:00 PM EST on business days are processed for same-day dispatch. Delivery timeframes vary by location and carrier. Risk of loss and title for items pass to you upon delivery to the carrier.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  Free expedited shipping is available on orders over $200. Tracking information is provided via email upon dispatch.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Intellectual Property
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  All content on the Site, including text, graphics, logos, images, product photography, and software, is the property of Vintage Peptides or its licensors and is protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  You may not reproduce, distribute, modify, display, or create derivative works from any Site content without prior written consent. Unauthorized use may result in civil and criminal penalties.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Limitation of Liability
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  To the fullest extent permitted by law, Vintage Peptides shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Site or purchase of products, including but not limited to personal injury, property damage, or loss of profits.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  Our total liability for any claim arising from these Terms or your use of the Site shall not exceed the amount you paid for the specific product or service giving rise to the claim.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Governing Law & Dispute Resolution
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the Commonwealth of Massachusetts, without regard to its conflict of law principles.
                </p>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  Any dispute arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration in Boston, Massachusetts, under the rules of the American Arbitration Association.
                </p>
              </div>

              <div className="brass-rule max-w-xs" />

              <div className="space-y-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                  Contact Information
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  For questions about these Terms of Service, please contact us at:
                </p>
                <div className="font-mono text-sm text-saddle space-y-1">
                  <p>Vintage Peptides, LLC</p>
                  <p>247 Research Way, Suite 400</p>
                  <p>Boston, MA 02118</p>
                  <p className="mt-2">
                    <a href="mailto:research@vintagepeptides.com" className="text-brass hover:text-espresso transition-colors underline underline-offset-2">
                      research@vintagepeptides.com
                    </a>
                  </p>
                  <p>(866) 788-GLP1</p>
                </div>
              </div>

              <div className="p-6 border border-dashed border-brass/20 bg-cream/30 text-center">
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso/80 mb-2">
                  Last Updated
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
