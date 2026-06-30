import { Link } from 'react-router-dom';
import { useSections } from '@/context/SectionsContext';

export default function Footer() {
  const { sections } = useSections();
  const s = sections.footer;

  return (
    <footer className="bg-espresso text-cream/80 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-8">
        <div className="flex justify-center mb-10">
          <img
            src="https://db.vintagepeptides.com/wp-content/uploads/2026/06/WhatsApp_Image_2026-06-17_at_15.47.54-removebg-preview.png"
            alt="Vintage Peptides"
            className="h-16 w-auto object-contain"
          />
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
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-phone-line text-xs text-brass" />
                </span>
                {s.phone}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-mail-line text-xs text-brass" />
                </span>
                {s.email}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brass/20 pt-6 mb-6">
          <div className="brass-rule max-w-xs mx-auto mb-6" />
          <p className="font-body text-[10px] italic text-cream/50 text-center leading-relaxed max-w-4xl mx-auto">
            {s.disclaimer}
          </p>
          <div className="flex items-center justify-center gap-5 mt-6">
            <a
              href={s.instagram_url}
              className="w-5 h-5 flex items-center justify-center text-cream/40 hover:text-brass transition-colors cursor-pointer"
            >
              <i className="ri-instagram-line" />
            </a>
            <a
              href={s.twitter_url}
              className="w-5 h-5 flex items-center justify-center text-cream/40 hover:text-brass transition-colors cursor-pointer"
            >
              <i className="ri-twitter-x-line" />
            </a>
            <a
              href={s.linkedin_url}
              className="w-5 h-5 flex items-center justify-center text-cream/40 hover:text-brass transition-colors cursor-pointer"
            >
              <i className="ri-linkedin-line" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 pt-6 border-t border-brass/10">
          <div className="flex items-center gap-3">
            <span className="font-display text-[10px] tracking-widest uppercase text-brass">
              We Accept
            </span>
            {s.payment_methods.map((method, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {i > 0 && <span className="text-cream/20">·</span>}
                <span className="font-mono text-xs text-cream/60">{method}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-cream/40">
            <p className="font-body text-[11px]">{s.copyright}</p>
            <span className="text-cream/20">·</span>
            <p className="font-body text-[11px]">Made by <a href="https://velocity72.com" target="_blank" rel="nofollow" className="hover:text-brass transition-colors">Velocity72</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
}
