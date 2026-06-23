import PageLayout from '@/components/feature/PageLayout';

export default function PrivacyPolicy() {
  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain">
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-espresso mt-3">
              Privacy Policy
            </h1>
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Introduction
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                Vintage Peptides, LLC ("Vintage Peptides," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and safeguard your personal information when you visit our website, create an account, or make purchases.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                By using the Vintage Peptides website, you consent to the practices described in this Privacy Policy. If you do not agree, please do not use the Site.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Information We Collect
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                We collect information that you provide directly to us, as well as data collected automatically through your use of the Site.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                <strong className="text-espresso">Information you provide:</strong> Name, email address, phone number, shipping address, billing address, institutional affiliation, payment information, and any communications you send us.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                <strong className="text-espresso">Automatically collected:</strong> IP address, browser type, device information, operating system, pages visited, time spent on pages, referral sources, and cookies. We use this data to improve Site functionality and user experience.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                How We Use Your Information
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                We use the information we collect for the following purposes:
              </p>
              <ul className="space-y-2.5 ml-4">
                {[
                  'Processing and fulfilling orders, including shipping and delivery',
                  'Verifying age and research eligibility requirements',
                  'Communicating order status, shipping updates, and support inquiries',
                  'Providing customer support and responding to questions',
                  'Improving our products, services, and website experience',
                  'Sending promotional emails and newsletters (with your consent)',
                  'Detecting fraud, abuse, and unauthorized activity',
                  'Complying with legal obligations and regulatory requirements',
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
                Data Sharing & Third Parties
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share information with trusted service providers who assist us in operating the Site, processing payments, fulfilling orders, or conducting business operations.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                These third parties are contractually obligated to maintain the confidentiality and security of your data and are prohibited from using it for any purpose other than providing services to Vintage Peptides.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                We may also disclose information when required by law, subpoena, or governmental request, or to protect our rights, property, or safety, or that of our users or the public.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Data Security
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                We implement reasonable administrative, technical, and physical safeguards to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include SSL encryption, secure server infrastructure, and restricted access protocols.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Cookies & Tracking Technologies
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                The Site uses cookies and similar tracking technologies to enhance your browsing experience, analyze Site traffic, and understand user behavior. Cookies are small text files stored on your device that help us recognize you and remember your preferences.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                You can configure your browser to refuse all cookies or to alert you when cookies are being sent. However, some features of the Site may not function properly without cookies.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Your Rights & Choices
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                You have the right to access, update, correct, or delete your personal information. You may also opt out of receiving promotional emails by clicking the unsubscribe link in any email or contacting us directly.
              </p>
              <p className="font-body text-sm text-saddle leading-relaxed">
                To exercise these rights, please contact us at <a href="mailto:research@vintagepeptides.com" className="text-brass hover:text-espresso transition-colors underline underline-offset-2">research@vintagepeptides.com</a>. We will respond to reasonable requests within the timeframe required by applicable law.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Data Retention
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Order and transaction records are retained for a minimum of seven years for regulatory and tax compliance.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Children's Privacy
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                The Site is not intended for individuals under 21 years of age. We do not knowingly collect personal information from anyone under 21. If we become aware that we have collected information from a person under 21, we will delete it promptly.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Changes to This Policy
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised effective date. We encourage you to review this policy periodically.
              </p>
            </div>

            <div className="brass-rule max-w-xs" />

            <div className="space-y-6">
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                Contact Us
              </h2>
              <p className="font-body text-sm text-saddle leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
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