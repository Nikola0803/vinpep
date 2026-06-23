import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-espresso text-cream/80 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-8">
        <div className="flex justify-center mb-10">
          <div className="w-16 h-16 rounded-full border-2 border-brass flex items-center justify-center">
            <span className="font-display text-lg text-brass tracking-widest">
              VP
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          <div>
            <h4 className="font-display text-xs tracking-[0.25em] uppercase text-brass mb-5">
              Quick Menu
            </h4>
            <ul className="space-y-2.5">
              {['Shop', 'COA', 'FAQs', 'Contact'].map(
                (item) => (
                  <li key={item}>
                    <Link
                      to={item === 'Shop' ? '/shop' : item === 'COA' ? '/coa' : item === 'FAQs' ? '/faqs' : '/contact'}
                      className="font-body text-sm hover:text-brass transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xs tracking-[0.25em] uppercase text-brass mb-5">
              Testing & Info
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Purity Standards', href: null },
                { label: 'COA Verification', href: '/coa' },
                { label: 'HPLC Testing', href: null },
                { label: 'Mass Spec Analysis', href: null },
                { label: 'Batch Tracking', href: null },
                { label: 'Research Use Policy', href: '/research-use-policy' },
              ].map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="font-body text-sm hover:text-brass transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-body text-sm hover:text-brass transition-colors cursor-pointer">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xs tracking-[0.25em] uppercase text-brass mb-5">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Terms of Service', href: '/terms-of-service' },
                { label: 'Privacy Policy', href: '/privacy-policy' },
                { label: 'Research Use Policy', href: '/research-use-policy' },
                { label: 'Return Policy', href: '/return-policy' },
                { label: 'Shipping Policy', href: '#' },
                { label: 'Disclaimer', href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="font-body text-sm hover:text-brass transition-colors cursor-pointer"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xs tracking-[0.25em] uppercase text-brass mb-5">
              Contact
            </h4>
            <ul className="space-y-2.5 font-body text-sm">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="ri-map-pin-line text-xs text-brass" />
                </span>
                247 Research Way, Suite 400<br />Boston, MA 02118
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-phone-line text-xs text-brass" />
                </span>
                (866) 788-GLP1
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-mail-line text-xs text-brass" />
                </span>
                research@vintagepeptides.com
              </li>
              <li className="mt-3 pt-3 border-t border-brass/20">
                <span className="font-display text-[10px] tracking-widest uppercase text-brass">
                  Hours
                </span>
                <p className="mt-1 text-xs text-cream/60">
                  Mon – Fri: 9:00 AM – 6:00 PM EST<br />
                  Sat: 10:00 AM – 2:00 PM EST
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brass/20 pt-6 mb-6">
          <div className="brass-rule max-w-xs mx-auto mb-6" />
          <p className="font-body text-[10px] italic text-cream/50 text-center leading-relaxed max-w-4xl mx-auto">
            All products sold by Vintage Peptides are intended for laboratory research use only.
            These products are not for human consumption, nor are they intended to diagnose, treat,
            cure, or prevent any disease or condition. By purchasing from this site, you affirm that
            you are a qualified researcher aged 21 or older and understand the risks associated with
            research chemicals. All statements and products on this website have not been evaluated
            by the Food and Drug Administration.
          </p>
          <div className="flex items-center justify-center gap-5 mt-6">
            <span className="w-5 h-5 flex items-center justify-center text-cream/40 hover:text-brass transition-colors cursor-pointer">
              <i className="ri-instagram-line" />
            </span>
            <span className="w-5 h-5 flex items-center justify-center text-cream/40 hover:text-brass transition-colors cursor-pointer">
              <i className="ri-twitter-x-line" />
            </span>
            <span className="w-5 h-5 flex items-center justify-center text-cream/40 hover:text-brass transition-colors cursor-pointer">
              <i className="ri-linkedin-line" />
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 pt-6 border-t border-brass/10">
          <div className="flex items-center gap-3">
            <span className="font-display text-[10px] tracking-widest uppercase text-brass">
              We Accept
            </span>
            <span className="font-mono text-xs text-cream/60">Zelle</span>
            <span className="text-cream/20">·</span>
            <span className="font-mono text-xs text-cream/60">Cash App</span>
            <span className="text-cream/20">·</span>
            <span className="font-mono text-xs text-cream/60">Venmo</span>
          </div>
          <div className="flex items-center gap-4 text-cream/40">
            <p className="font-body text-[11px]">© 2026 Vintage Peptides. All rights reserved.</p>
            <span className="text-cream/20">·</span>
            <p className="font-body text-[11px]">Made by <a href="https://velocity72.com" target="_blank" rel="nofollow" className="hover:text-brass transition-colors">Velocity72</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
}