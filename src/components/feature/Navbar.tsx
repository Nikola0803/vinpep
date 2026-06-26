import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'COA', href: '/coa' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav
      className={`w-full relative z-40 transition-all duration-500 ${
        scrolled
          ? 'fixed top-0 left-0 right-0 bg-espresso shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div
        className={`border-b transition-colors duration-500 ${
          scrolled ? 'border-brass/40' : 'border-brass/20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img
              src="https://db.vintagepeptides.com/wp-content/uploads/2026/06/WhatsApp_Image_2026-06-17_at_15.47.54-removebg-preview.png"
              alt="Vintage Peptides"
              className="h-14 w-auto object-contain group-hover:opacity-80 transition-opacity"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`font-display text-[11px] tracking-[0.2em] uppercase hover:text-brass transition-colors font-small-caps whitespace-nowrap ${
                  scrolled ? 'text-cream/80' : 'text-espresso'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* Search icon in nav */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`w-8 h-8 flex items-center justify-center transition-colors ${
                scrolled ? 'text-cream/80 hover:text-brass' : 'text-espresso hover:text-brass'
              }`}
              aria-label="Search"
            >
              <i className="ri-search-line text-sm" />
            </button>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`w-8 h-8 flex items-center justify-center transition-colors ${
                scrolled ? 'text-cream/80 hover:text-brass' : 'text-espresso hover:text-brass'
              }`}
              aria-label="Search"
            >
              <i className="ri-search-line text-sm" />
            </button>
            <button
              className={`w-8 h-8 flex items-center justify-center transition-colors ${
                scrolled ? 'text-cream' : 'text-espresso'
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <i className={mobileOpen ? 'ri-close-line' : 'ri-menu-line'} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable search bar */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-espresso border-b border-brass/40 z-50">
          <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
            <span className="w-5 h-5 flex items-center justify-center text-brass flex-shrink-0">
              <i className="ri-search-line text-sm" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search peptides by name, code, or CAS number..."
              autoFocus
              className="flex-1 bg-transparent font-body text-sm text-cream placeholder:text-cream/40 focus:outline-none"
            />
            <button
              type="submit"
              className="font-display text-[10px] tracking-[0.2em] uppercase text-brass border border-brass/40 px-4 py-1.5 hover:bg-brass hover:text-espresso transition-colors whitespace-nowrap"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="w-6 h-6 flex items-center justify-center text-cream/60 hover:text-cream"
            >
              <i className="ri-close-line" />
            </button>
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="md:hidden bg-espresso border-b border-brass/30">
          <div className="px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-display text-xs tracking-[0.2em] uppercase text-cream/80 hover:text-brass transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}