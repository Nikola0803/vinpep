import PageLayout from '@/components/feature/PageLayout';

export default function ReturnPolicy() {
  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain">
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-espresso mt-3">
              Return Policy
            </h1>
          </div>

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
                    Due to the sensitive nature of research chemicals and peptides, our return policy is more restrictive than standard retail. Please review this policy carefully before placing an order.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                General Return Policy
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                We accept returns on <strong className="text-espresso">unopened, unused products</strong> within <strong className="text-espresso">14 days</strong> of delivery. All returns are subject to inspection and approval. Products must be in their original packaging with all seals intact, labels undamaged, and documentation included.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                Due to the nature of research chemicals, we <strong className="text-espresso">cannot accept returns</strong> on opened, used, reconstituted, or partially consumed products. This policy exists to protect the integrity and safety of our product line.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Eligible Returns
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                A return may be eligible under the following conditions:
              </p>
              <ul className="space-y-2.5 ml-4">
                {[
                  'Product was received in damaged or compromised packaging',
                  'Incorrect product was shipped (wrong item, dosage, or quantity)',
                  'Product quality does not match the documented Certificate of Analysis',
                  'Order was placed in error and product remains completely unopened',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 flex items-center justify-center text-brass mt-0.5 flex-shrink-0">
                      <i className="ri-checkbox-circle-line text-xs" />
                    </span>
                    <span className="font-body text-sm text-saddle">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Return Process
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                To initiate a return, please contact our research support team within 14 days of delivery:
              </p>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Contact Support', desc: 'Email research@vintagepeptides.com or call 1-800-VP-PEP-1 with your order number and reason for return.' },
                  { step: '2', title: 'Await Approval', desc: 'Our team will review your request and respond within 2 business days with return authorization and instructions.' },
                  { step: '3', title: 'Ship the Product', desc: 'Package the unopened product securely in its original packaging with all documentation. Include the return authorization form.' },
                  { step: '4', title: 'Inspection & Refund', desc: 'Once received, we inspect the product. Approved returns are processed within 5-7 business days.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border border-brass/20 bg-cream/30">
                    <span className="w-6 h-6 flex items-center justify-center bg-brass text-espresso font-mono text-xs font-bold flex-shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-display text-xs tracking-wider uppercase text-espresso">{item.title}</p>
                      <p className="font-body text-xs text-saddle/70 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Refunds & Restocking
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                Approved returns are refunded to the original payment method. Please allow 5-10 business days for the refund to appear, depending on your payment provider.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                A <strong className="text-espresso">15% restocking fee</strong> applies to all approved returns for change-of-mind or incorrect orders placed by the customer. This fee does not apply to returns due to damaged goods, incorrect shipments, or quality discrepancies verified against the CoA.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                Shipping costs are non-refundable. Return shipping is the responsibility of the customer unless the return is due to our error.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Damaged or Defective Products
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                If you receive a product with damaged packaging, compromised seals, or visible signs of tampering, <strong className="text-espresso">do not open or use the product</strong>. Contact us immediately within 48 hours of delivery with photographs of the damage and packaging.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                We will replace damaged products at no cost or issue a full refund, including shipping, once the damage is verified. We may request the product be returned for inspection.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Exclusions
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                The following are not eligible for returns under any circumstances:
              </p>
              <ul className="space-y-2.5 ml-4">
                {[
                  'Opened, reconstituted, or partially used products',
                  'Products without original packaging, labels, or documentation',
                  'Products returned beyond the 14-day return window',
                  'Products damaged due to improper storage by the customer',
                  'Products ordered without verifying eligibility or intended use',
                  'International orders (domestic US only)',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 flex items-center justify-center text-red-900/40 mt-0.5 flex-shrink-0">
                      <i className="ri-close-circle-line text-xs" />
                    </span>
                    <span className="font-body text-sm text-saddle">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Contact for Returns
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                For all return inquiries, please contact our research support team:
              </p>
              <div className="font-mono text-sm text-saddle space-y-1">
                <p>
                  <a href="mailto:research@vintagepeptides.com" className="text-brass hover:text-espresso transition-colors underline underline-offset-2">
                    research@vintagepeptides.com
                  </a>
                </p>
                <p>1-800-VP-PEP-1</p>
                <p className="text-xs text-saddle/60 mt-1">Mon – Fri: 9:00 AM – 6:00 PM EST</p>
              </div>
            </div>

            <div className="p-6 border border-dashed border-brass/20 bg-cream/30 text-center">
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso/80 mb-2">
                Effective Date
              </p>
              <p className="font-mono text-xs text-saddle">
                January 1, 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}