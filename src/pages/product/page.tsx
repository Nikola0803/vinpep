import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';
import { useCart } from '@/context/CartContext';
import { products } from '@/mocks/products';
import { useState, useMemo } from 'react';
import ProductCard from '@/pages/home/components/ProductCard';

const tabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'COA', value: 'coa' },
  { label: 'Test Results', value: 'tests' },
  { label: 'Research Protocol', value: 'protocol' },
];

const commonQuestions = [
  {
    q: 'What purity level does this product meet?',
    a: 'All Vintage Peptides compounds are purified by preparative HPLC to ≥99.0% purity, verified by analytical HPLC and electrospray mass spectrometry. Each batch receives a lot-specific Certificate of Analysis (CoA).',
  },
  {
    q: 'How should I store this product?',
    a: 'Lyophilized vials should be stored at -20°C in a desiccated environment. Reconstituted solutions are stable for 14 days at 2–8°C or 90 days at -20°C when stored in suitable aliquots.',
  },
  {
    q: 'Is this product suitable for human use?',
    a: 'No. All products sold by Vintage Peptides are strictly for laboratory research use only. They are not intended for human consumption, injection, or therapeutic use. By purchasing, you confirm you are a qualified researcher using this product in a controlled laboratory setting.',
  },
  {
    q: 'What is the reconstitution process?',
    a: 'Reconstitute with bacteriostatic water (0.9% benzyl alcohol) or sterile water for injection. Allow the vial to come to room temperature before opening. Add solvent slowly down the inner wall of the vial. Do not shake vigorously — gentle swirling is preferred.',
  },
  {
    q: 'Do you provide third-party testing documentation?',
    a: 'Yes. Every batch is independently tested by third-party laboratories. Full HPLC, Mass Spectrometry, and Amino Acid Analysis reports are available for download under the COA tab on each product page.',
  },
  {
    q: 'What are the shipping options?',
    a: 'We offer tracked domestic US shipping. Orders over $200 qualify for free shipping. All orders placed before 2:00 PM EST are dispatched the same day.',
  },
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDosage, setSelectedDosage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);

  const product = products.find((p) => p.id === id);

  // Related products: same subcategory, exclude current
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const sameCategory = products.filter(
      (p) => p.id !== product.id && p.subcategory === product.subcategory
    );
    if (sameCategory.length >= 4) {
      return sameCategory.slice(0, 4);
    }
    // Fill with popular products
    const others = products.filter(
      (p) => p.id !== product.id && !sameCategory.includes(p)
    );
    return [...sameCategory, ...others].slice(0, 4);
  }, [product]);

  if (!product) {
    return (
      <PageLayout>
        <div className="py-24 text-center parchment-grain">
          <div className="relative z-10">
            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-xl tracking-[0.2em] uppercase text-espresso mt-3">
              Product Not Found
            </h1>
            <button
              onClick={() => navigate('/shop')}
              className="mt-6 font-display text-xs tracking-[0.2em] uppercase text-brass hover:text-brass-light transition-colors"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const dosages = product.dosage.split(' / ');
  const currentPrice = selectedDosage ? product.priceMax : product.priceMin;
  const totalPrice = currentPrice * quantity;

  const StarRating = () => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`w-3.5 h-3.5 flex items-center justify-center text-xs ${
            star <= Math.round(product.rating) ? 'text-brass' : 'text-brass/20'
          }`}
        >
          <i className="ri-star-fill" />
        </span>
      ))}
      <span className="font-mono text-xs text-saddle ml-2">{product.rating} / 5.0</span>
      <span className="font-body text-xs text-saddle/60 ml-2">({product.reviewCount} verified reviews)</span>
    </div>
  );

  return (
    <PageLayout>
      <div className="py-8 md:py-12 parchment-grain">
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 font-body text-xs text-saddle">
            <button onClick={() => navigate('/')} className="hover:text-brass transition-colors">Home</button>
            <span>/</span>
            <button onClick={() => navigate('/shop')} className="hover:text-brass transition-colors">Shop</button>
            <span>/</span>
            <span className="text-espresso uppercase tracking-wider">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left: Product Image */}
            <div>
              <div className="aspect-[4/5] border border-brass/30 bg-cream/40 relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
                {/* Purity badge */}
                <div className="absolute top-4 left-4 stamp-badge w-16 h-16">
                  <span className="text-center leading-tight text-[11px]">
                    {product.purity}
                    <br />
                    <span className="text-[8px]">PURITY</span>
                  </span>
                </div>
                {/* Stock badge */}
                <div className="absolute top-4 right-4">
                  {product.stockCount <= 25 ? (
                    <span className="bg-espresso/90 border border-brass text-brass font-display text-[9px] tracking-[0.15em] uppercase px-2.5 py-1">
                      Only {product.stockCount} Left
                    </span>
                  ) : product.stockCount <= 60 ? (
                    <span className="bg-espresso/80 text-cream/90 font-display text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 border border-cream/20">
                      Low Stock
                    </span>
                  ) : (
                    <span className="bg-brass text-espresso font-display text-[9px] tracking-[0.15em] uppercase px-2.5 py-1">
                      In Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Trust badges row */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="aspect-square border border-brass/20 bg-cream/40 flex flex-col items-center justify-center p-2 text-center">
                  <span className="w-6 h-6 flex items-center justify-center text-brass mb-1">
                    <i className="ri-flask-line text-sm" />
                  </span>
                  <span className="font-mono text-[10px] text-saddle/70 leading-tight">HPLC<br />Verified</span>
                </div>
                <div className="aspect-square border border-brass/20 bg-cream/40 flex flex-col items-center justify-center p-2 text-center">
                  <span className="w-6 h-6 flex items-center justify-center text-brass mb-1">
                    <i className="ri-bar-chart-line text-sm" />
                  </span>
                  <span className="font-mono text-[10px] text-saddle/70 leading-tight">Mass<br />Spec ID</span>
                </div>
                <div className="aspect-square border border-brass/20 bg-cream/40 flex flex-col items-center justify-center p-2 text-center">
                  <span className="w-6 h-6 flex items-center justify-center text-brass mb-1">
                    <i className="ri-map-pin-line text-sm" />
                  </span>
                  <span className="font-mono text-[10px] text-saddle/70 leading-tight">USA<br />Lyophilized</span>
                </div>
              </div>
            </div>

            {/* Right: Product info */}
            <div>
              <div className="mb-2">
                <span className="font-mono text-[10px] tracking-wider uppercase text-brass">{product.subcategory}</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl tracking-[0.15em] uppercase text-espresso mb-2">
                {product.name}
              </h1>
              <p className="font-body text-base italic text-saddle mb-3">
                {product.peptideCode}
              </p>
              <div className="mb-4">
                <StarRating />
              </div>
              <p className="font-mono text-sm text-leather mb-6">
                CAS: {product.casNumber}
              </p>

              <div className="brass-rule max-w-xs mb-6" />

              <p className="font-body text-sm text-saddle leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Dosage selector */}
              <div className="mb-6">
                <p className="font-display text-[11px] tracking-[0.2em] uppercase text-espresso mb-3">
                  Select Dosage
                </p>
                <div className="flex flex-wrap gap-2">
                  {dosages.map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDosage(d)}
                      className={`font-mono text-xs px-5 py-2.5 border transition-all duration-300 ${
                        selectedDosage === d
                          ? 'bg-brass text-espresso border-brass'
                          : 'bg-transparent text-saddle border-brass/30 hover:border-brass'
                      }`}
                    >
                      {d.trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity selector */}
              <div className="mb-6">
                <p className="font-display text-[11px] tracking-[0.2em] uppercase text-espresso mb-3">
                  Quantity
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center border border-brass/30 text-espresso hover:bg-brass hover:text-espresso transition-colors"
                  >
                    <i className="ri-subtract-line" />
                  </button>
                  <div className="w-12 h-10 flex items-center justify-center border border-brass/30 font-mono text-sm text-espresso">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center border border-brass/30 text-espresso hover:bg-brass hover:text-espresso transition-colors"
                  >
                    <i className="ri-add-line" />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-8">
                <span className="font-mono text-3xl text-brass font-bold">
                  ${totalPrice}
                </span>
                <span className="font-body text-xs italic text-saddle">
                  ${currentPrice} per vial
                </span>
              </div>

              {/* Add to Cart */}
              <button
                onClick={() =>
                  addItem({
                    id: product.id,
                    name: product.name,
                    peptideCode: product.peptideCode,
                    price: currentPrice,
                    dosage: selectedDosage || product.dosage,
                  })
                }
                className="w-full md:w-auto bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-4 px-12 border border-brass transition-all duration-300 hover:shadow-[0_0_20px_rgba(184,148,42,0.3)] whitespace-nowrap"
              >
                Add to Cart
              </button>

              {/* View CoA link */}
              <div className="mt-3">
                <button
                  onClick={() => setActiveTab('coa')}
                  className="flex items-center gap-2 font-mono text-xs text-brass hover:text-espresso transition-colors"
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-file-list-3-line" />
                  </span>
                  View Certificate of Analysis (CoA)
                </button>
              </div>

              {/* Urgency strip */}
              <div className="mt-5 flex items-center gap-2 p-3 border border-red-900/10 bg-red-900/[0.03]">
                <span className="w-5 h-5 flex items-center justify-center text-red-800/70">
                  <i className="ri-fire-line" />
                </span>
                <span className="font-mono text-xs text-red-900/80">
                  Limited stock — <strong className="text-red-900">13 people</strong> are viewing this product right now
                </span>
              </div>

              {/* Delivery & shipping info */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5 p-3 border border-brass/15 bg-cream/40">
                  <span className="w-5 h-5 flex items-center justify-center text-brass mt-0.5">
                    <i className="ri-time-line" />
                  </span>
                  <div>
                    <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso">Same-Day Processing</p>
                    <p className="font-mono text-[10px] text-saddle/70 mt-0.5">Order before 2pm EST</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 border border-brass/15 bg-cream/40">
                  <span className="w-5 h-5 flex items-center justify-center text-brass mt-0.5">
                    <i className="ri-truck-line" />
                  </span>
                  <div>
                    <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso">Tracked Delivery</p>
                    <p className="font-mono text-[10px] text-saddle/70 mt-0.5">US domestic shipping only</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 border border-brass/15 bg-cream/40 sm:col-span-2">
                  <span className="w-5 h-5 flex items-center justify-center text-brass mt-0.5">
                    <i className="ri-customer-service-2-line" />
                  </span>
                  <div>
                    <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso">7-Day Expert Support</p>
                    <p className="font-mono text-[10px] text-saddle/70 mt-0.5">(208) 243-9222</p>
                  </div>
                </div>
              </div>

              {/* Trust line */}
              <div className="flex flex-wrap items-center gap-4 mt-5 text-xs">
                <span className="flex items-center gap-1.5 font-mono text-saddle/60">
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-brass">
                    <i className="ri-shield-check-line" />
                  </span>
                  Third-Party Tested
                </span>
                <span className="flex items-center gap-1.5 font-mono text-saddle/60">
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-brass">
                    <i className="ri-truck-line" />
                  </span>
                  Free Shipping $200+
                </span>
                <span className="flex items-center gap-1.5 font-mono text-saddle/60">
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-brass">
                    <i className="ri-refresh-line" />
                  </span>
                  Same-Day Dispatch
                </span>
              </div>

              {/* Research Use Only — prominent disclaimer */}
              <div className="mt-6 p-4 border border-dashed border-red-900/20 bg-red-900/[0.02]">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-red-900/50 mt-0.5">
                    <i className="ri-error-warning-line" />
                  </span>
                  <div>
                    <p className="font-display text-[10px] tracking-[0.15em] uppercase text-red-900/80 mb-1">
                      For Research Use Only
                    </p>
                    <p className="font-mono text-[10px] leading-relaxed text-saddle/60">
                      Not intended for human consumption, injection, or therapeutic use. By purchasing, you confirm you are a qualified researcher using this product in a controlled laboratory setting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-16 border-t border-brass/20 pt-8">
            <div className="flex flex-wrap gap-2 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`font-display text-[11px] tracking-[0.2em] uppercase px-5 py-2 border transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.value
                      ? 'bg-espresso text-cream border-espresso'
                      : 'bg-transparent text-saddle border-brass/30 hover:border-brass hover:text-espresso'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-[200px]">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                    Product Overview
                  </h3>
                  <p className="font-body text-sm text-saddle leading-relaxed">
                    {product.description} This compound is lyophilized via solid-phase peptide synthesis (SPPS)
                    using Fmoc chemistry on a polystyrene resin. The crude peptide is purified by preparative
                    HPLC to a purity of {product.purity} or greater, as verified by analytical HPLC and
                    electrospray mass spectrometry.
                  </p>
                  <p className="font-body text-sm text-saddle leading-relaxed">
                    Each vial contains lyophilized powder sealed under argon. Reconstitution should be performed
                    with bacteriostatic water or the appropriate solvent for your research protocol. Store
                    lyophilized material at -20°C and reconstituted solution at 2-8°C.
                  </p>
                </div>
              )}

              {activeTab === 'coa' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 border border-brass/20 bg-cream/30">
                      <p className="font-mono text-[10px] text-saddle/60 uppercase mb-1">Purity</p>
                      <p className="font-mono text-lg text-brass font-bold">{product.purity}</p>
                    </div>
                    <div className="p-4 border border-brass/20 bg-cream/30">
                      <p className="font-mono text-[10px] text-saddle/60 uppercase mb-1">Appearance</p>
                      <p className="font-mono text-sm text-espresso">White Powder</p>
                    </div>
                    <div className="p-4 border border-brass/20 bg-cream/30">
                      <p className="font-mono text-[10px] text-saddle/60 uppercase mb-1">Moisture</p>
                      <p className="font-mono text-sm text-espresso">&lt; 3.0%</p>
                    </div>
                    <div className="p-4 border border-brass/20 bg-cream/30">
                      <p className="font-mono text-[10px] text-saddle/60 uppercase mb-1">Endotoxin</p>
                      <p className="font-mono text-sm text-espresso">&lt; 5 EU/mg</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5">
                      Download Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { name: 'Certificate of Analysis (COA)', file: `${product.name}_COA_LotVP2026-05.pdf`, size: '284 KB', date: 'May 2026', icon: 'ri-file-list-3-line' },
                        { name: 'HPLC Purity Report', file: `${product.name}_HPLC_2026-05.pdf`, size: '1.2 MB', date: 'May 2026', icon: 'ri-bar-chart-box-line' },
                        { name: 'Mass Spectrometry Report', file: `${product.name}_MS_2026-05.pdf`, size: '856 KB', date: 'May 2026', icon: 'ri-pulse-line' },
                        { name: 'Safety Data Sheet (SDS)', file: `${product.name}_SDS_2026.pdf`, size: '412 KB', date: 'May 2026', icon: 'ri-shield-check-line' },
                      ].map((doc, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border border-brass/20 bg-cream/30 hover:bg-cream/50 transition-colors">
                          <span className="w-10 h-10 flex items-center justify-center text-brass text-lg flex-shrink-0">
                            <i className={doc.icon} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-xs tracking-wider uppercase text-espresso truncate">{doc.name}</p>
                            <p className="font-mono text-[10px] text-saddle/60 mt-0.5">
                              {doc.file} &middot; {doc.size} &middot; {doc.date}
                            </p>
                          </div>
                          <button className="flex items-center gap-1.5 px-3 py-2 border border-brass/40 text-espresso hover:bg-brass hover:text-espresso transition-all duration-300 flex-shrink-0">
                            <span className="w-4 h-4 flex items-center justify-center text-xs">
                              <i className="ri-download-line" />
                            </span>
                            <span className="font-mono text-[10px] tracking-wider uppercase">Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border border-dashed border-brass/20 bg-cream/20">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 flex items-center justify-center text-brass/50 mt-0.5">
                        <i className="ri-information-line" />
                      </span>
                      <div>
                        <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso/80 mb-1">
                          Lot-Specific Documentation
                        </p>
                        <p className="font-mono text-[10px] leading-relaxed text-saddle/60">
                          All documents are lot-specific and generated by independent third-party laboratories. Each batch receives a unique lot number (e.g., VP2026-05) for full traceability. Download links are active for 90 days from batch release.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-4">
                  <h3 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                    Analytical Test Results
                  </h3>
                  <div className="space-y-3">
                    {[
                      { test: 'HPLC Purity', result: product.purity, method: 'C18 reverse-phase, 220nm' },
                      { test: 'Mass Spectrometry', result: 'Confirmed', method: 'ESI-TOF MS' },
                      { test: 'Amino Acid Analysis', result: '±2% expected', method: 'Pre-column derivatization' },
                      { test: 'Peptide Content', result: '≥85%', method: 'Ninhydrin assay' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-brass/20 bg-cream/30">
                        <div>
                          <p className="font-display text-xs tracking-wider uppercase text-espresso">{t.test}</p>
                          <p className="font-mono text-[10px] text-saddle/60">{t.method}</p>
                        </div>
                        <p className="font-mono text-sm text-brass font-bold">{t.result}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'protocol' && (
                <div className="space-y-4">
                  <h3 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                    Research Protocol Notes
                  </h3>
                  <div className="p-5 border border-brass/30 bg-cream/40">
                    <p className="font-body text-sm text-saddle leading-relaxed mb-4">
                      <strong className="text-espresso">Storage:</strong> Lyophilized vials should be stored at
                      -20°C in a desiccated environment. Reconstituted solutions are stable for 14 days at 2-8°C
                      or 90 days at -20°C when stored in suitable aliquots.
                    </p>
                    <p className="font-body text-sm text-saddle leading-relaxed mb-4">
                      <strong className="text-espresso">Reconstitution:</strong> Reconstitute with bacteriostatic
                      water (0.9% benzyl alcohol) or sterile water for injection. Allow the vial to come to room
                      temperature before opening. Add solvent slowly down the inner wall of the vial. Do not shake
                      vigorously — gentle swirling is preferred to avoid mechanical degradation.
                    </p>
                    <p className="font-body text-sm italic text-saddle/60">
                      These notes are for research reference only and do not constitute usage instructions.
                      Researchers should develop protocols appropriate to their specific experimental design.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Common Questions */}
          <div className="mt-16 border-t border-brass/20 pt-8">
            <div className="mb-8">
              <span className="font-mono text-[10px] tracking-wider uppercase text-brass">FAQ</span>
              <h2 className="font-display text-xl md:text-2xl tracking-[0.15em] uppercase text-espresso mt-2">
                Common Questions
              </h2>
            </div>
            <div className="space-y-0">
              {commonQuestions.map((faq, i) => (
                <div key={i} className="border-b border-brass/15">
                  <button
                    onClick={() => setOpenQuestion(openQuestion === i ? null : i)}
                    className="w-full flex items-center justify-between py-4 text-left group"
                  >
                    <span className="font-display text-sm tracking-[0.1em] uppercase text-espresso group-hover:text-brass transition-colors">
                      {faq.q}
                    </span>
                    <span className={`w-6 h-6 flex items-center justify-center text-saddle transition-transform duration-300 ${openQuestion === i ? 'rotate-45' : ''}`}>
                      <i className="ri-add-line" />
                    </span>
                  </button>
                  {openQuestion === i && (
                    <div className="pb-4 pr-8">
                      <p className="font-body text-sm text-saddle leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 border-t border-brass/20 pt-16">
            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
              <div className="text-center mb-10">
                <span className="font-mono text-[10px] tracking-wider uppercase text-brass">More Products</span>
                <h2 className="font-display text-xl md:text-2xl tracking-[0.15em] uppercase text-espresso mt-2">
                  You May Also Like
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="relative bg-espresso overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://readdy.ai/api/search-image?query=Abstract%20dark%20espresso%20brown%20texture%20background%20with%20subtle%20brass%20gold%20metallic%20veins%20and%20organic%20grain%20patterns%2C%20rich%20luxurious%20vintage%20aesthetic%2C%20minimal%20elegant%20laboratory%20dark%20mood%2C%20high%20resolution%20texture%20background%2C%20no%20text%2C%20no%20objects%2C%20pure%20texture&width=1400&height=600&seq=cta-bg-v1&orientation=landscape')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/70 to-espresso/90" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-brass mb-4 block">
            Ready to Start?
          </span>
          <h2 className="font-display text-3xl md:text-5xl tracking-[0.1em] uppercase text-cream mb-4 leading-tight">
            Premium<br />
            <span className="text-brass">Peptides.</span><br />
            Proven Quality.
          </h2>
          <p className="font-body text-sm text-cream/70 leading-relaxed max-w-xl mx-auto mb-8">
            Research-grade peptides lyophilized and verified in the USA. Fast shipping, full documentation, expert support.
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-4 px-12 border border-brass transition-all duration-300 hover:shadow-[0_0_30px_rgba(184,148,42,0.4)] whitespace-nowrap"
          >
            Shop All Peptides
          </button>
        </div>
      </div>
    </PageLayout>
  );
}