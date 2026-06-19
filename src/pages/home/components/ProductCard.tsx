import { useState } from 'react';
import { useCart } from '../../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../../mocks/products';
import { sanitizeExcerpt } from '@/utils/sanitizeDescription';

interface ProductCardProps {
  product: Product;
}

interface DocPreview {
  name: string;
  file: string;
  size: string;
  date: string;
  type: string;
  icon: string;
}

const testDocs: DocPreview[] = [
  { name: 'HPLC Purity Report', file: 'HPLC_2026-05.pdf', size: '1.2 MB', date: 'May 2026', type: 'HPLC', icon: 'ri-bar-chart-box-line' },
  { name: 'Mass Spectrometry Report', file: 'MS_2026-05.pdf', size: '856 KB', date: 'May 2026', type: 'MS', icon: 'ri-pulse-line' },
  { name: 'Amino Acid Analysis', file: 'AAA_2026-05.pdf', size: '412 KB', date: 'May 2026', type: 'AAA', icon: 'ri-flask-line' },
  { name: 'Ninhydrin Peptide Content', file: 'NPC_2026-05.pdf', size: '298 KB', date: 'May 2026', type: 'NPC', icon: 'ri-test-tube-line' },
];

const coaDocs: DocPreview[] = [
  { name: 'Certificate of Analysis (COA)', file: 'COA_LotVP2026-05.pdf', size: '284 KB', date: 'May 2026', type: 'COA', icon: 'ri-file-list-3-line' },
  { name: 'HPLC Purity Report', file: 'HPLC_2026-05.pdf', size: '1.2 MB', date: 'May 2026', type: 'HPLC', icon: 'ri-bar-chart-box-line' },
  { name: 'Mass Spectrometry Report', file: 'MS_2026-05.pdf', size: '856 KB', date: 'May 2026', type: 'MS', icon: 'ri-pulse-line' },
  { name: 'Safety Data Sheet (SDS)', file: 'SDS_2026.pdf', size: '412 KB', date: 'May 2026', type: 'SDS', icon: 'ri-shield-check-line' },
];

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`w-3 h-3 flex items-center justify-center text-[10px] ${
              star <= Math.round(rating) ? 'text-brass' : 'text-brass/20'
            }`}
          >
            <i className="ri-star-fill" />
          </span>
        ))}
      </div>
      <span className="font-mono text-[10px] text-saddle ml-1">{rating}</span>
      <span className="font-mono text-[9px] text-saddle/50">({count})</span>
    </div>
  );
}

function StockBadge({ count }: { count: number }) {
  if (count <= 25) {
    return (
      <span className="absolute top-3 left-3 z-20 bg-espresso/90 border border-brass text-brass font-display text-[9px] tracking-[0.15em] uppercase px-2.5 py-1">
        Only {count} Left
      </span>
    );
  }
  if (count <= 60) {
    return (
      <span className="absolute top-3 left-3 z-20 bg-espresso/80 text-cream/90 font-display text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 border border-cream/20">
        Low Stock
      </span>
    );
  }
  return (
    <span className="absolute top-3 left-3 z-20 bg-brass text-espresso font-display text-[9px] tracking-[0.15em] uppercase px-2.5 py-1">
      In Stock
    </span>
  );
}

function QuickViewModal({
  open,
  mode,
  product,
  onClose,
}: {
  open: boolean;
  mode: 'tests' | 'coa';
  product: Product;
  onClose: () => void;
}) {
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const docs = mode === 'tests' ? testDocs : coaDocs;
  const title = mode === 'tests' ? 'Test Documents' : 'Certificate of Analysis';

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-xl max-h-[85vh] bg-parchment border border-brass/30 shadow-2xl overflow-y-auto pointer-events-auto">
          {/* Header */}
          <div className="sticky top-0 bg-parchment border-b border-brass/20 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-brass/20 overflow-hidden flex-shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div>
                <h3 className="font-display text-xs tracking-[0.15em] uppercase text-espresso">
                  {product.name}
                </h3>
                <p className="font-mono text-[10px] text-saddle/60 mt-0.5">
                  {title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-saddle hover:text-espresso transition-colors"
            >
              <i className="ri-close-line" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Product meta */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="font-mono text-[10px] tracking-wider uppercase text-brass bg-brass/10 px-2 py-1">
                {product.purity} Purity
              </span>
              <span className="font-mono text-[10px] text-saddle/60">
                CAS: {product.casNumber}
              </span>
              <span className="font-mono text-[10px] text-saddle/60">
                {product.dosage}
              </span>
            </div>

            {/* Document preview cards */}
            <div className="space-y-3">
              {docs.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 border border-brass/20 bg-cream/40 hover:bg-cream/60 transition-colors"
                >
                  {/* PDF thumbnail icon */}
                  <div className="w-12 h-14 flex-shrink-0 bg-brass/10 border border-brass/20 flex flex-col items-center justify-center relative">
                    <span className="w-8 h-8 flex items-center justify-center text-brass text-lg">
                      <i className={doc.icon} />
                    </span>
                    <span className="absolute bottom-1 font-mono text-[8px] tracking-wider uppercase text-brass/80">
                      {doc.type}
                    </span>
                  </div>

                  {/* Doc info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xs tracking-wider uppercase text-espresso">
                      {doc.name}
                    </p>
                    <p className="font-mono text-[10px] text-saddle/60 mt-0.5">
                      {product.name}_{doc.file} · {doc.size} · {doc.date}
                    </p>
                  </div>

                  {/* Download button */}
                  <button
                    onClick={() => {
                      setDownloaded(doc.file);
                      setTimeout(() => setDownloaded(null), 2000);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 border text-espresso transition-all duration-300 flex-shrink-0 ${
                      downloaded === doc.file
                        ? 'bg-brass/20 border-brass/50'
                        : 'border-brass/40 hover:bg-brass hover:text-espresso'
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center text-xs">
                      <i className={downloaded === doc.file ? 'ri-check-line' : 'ri-download-line'} />
                    </span>
                    <span className="font-mono text-[10px] tracking-wider uppercase whitespace-nowrap">
                      {downloaded === doc.file ? 'Downloaded' : 'Download'}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="mt-5 p-3 border border-dashed border-brass/20 bg-cream/20">
              <div className="flex items-start gap-2.5">
                <span className="w-4 h-4 flex items-center justify-center text-brass/50 mt-0.5">
                  <i className="ri-information-line" />
                </span>
                <p className="font-mono text-[10px] leading-relaxed text-saddle/60">
                  All documents are lot-specific and generated by independent third-party laboratories. Each batch receives a unique lot number for full traceability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [quickView, setQuickView] = useState<{ open: boolean; mode: 'tests' | 'coa' }>({ open: false, mode: 'tests' });

  return (
    <div className="group relative parchment-grain brass-double-border bg-parchment hover:border-brass transition-all duration-500 flex flex-col h-full">
      {/* Quick View Modal */}
      <QuickViewModal
        open={quickView.open}
        mode={quickView.mode}
        product={product}
        onClose={() => setQuickView({ open: false, mode: 'tests' })}
      />

      {/* Image Area — clickable */}
      <button
        onClick={() => navigate(`/product/${product.id}`)}
        className="relative aspect-[4/5] overflow-hidden border-b border-brass/20 w-full text-left cursor-pointer"
      >
        <StockBadge count={product.stockCount} />
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Purity stamp overlay on image */}
        <div className="absolute bottom-3 right-3 stamp-badge w-10 h-10 opacity-80">
          <span className="text-center leading-tight text-[9px]">
            {product.purity}
            <br />
            <span className="text-[7px]">PURITY</span>
          </span>
        </div>
      </button>

      <div className="relative z-10 p-4 md:p-5 flex flex-col flex-1">
        {/* Top row: monogram + purity removed from top, now on image */}
        <div className="flex items-start justify-between mb-2">
          <div className="w-6 h-6 rounded-full border border-brass/30 flex items-center justify-center">
            <span className="font-display text-[7px] text-brass/60 tracking-widest">
              VP
            </span>
          </div>
          <StarRating rating={product.rating} count={product.reviewCount} />
        </div>

        {/* Product name — clickable */}
        <button
          onClick={() => navigate(`/product/${product.id}`)}
          className="text-left cursor-pointer"
        >
          <h3 className="font-display text-sm tracking-[0.15em] uppercase text-espresso mb-0.5 hover:text-brass transition-colors">
            {product.name}
          </h3>
        </button>

        {/* Peptide code italic */}
        <p className="font-body text-xs italic text-saddle mb-1">
          {product.peptideCode}
        </p>

        {/* CAS number monospaced */}
        <p className="font-mono text-[10px] text-leather mb-2">
          CAS: {product.casNumber}
        </p>

        {/* Dosage */}
        <p className="font-display text-[11px] tracking-wider uppercase text-brass mb-2">
          {product.dosage}
        </p>

        {/* Price range */}
        <p className="font-mono text-base text-espresso font-bold mb-3">
          ${product.priceMin} – ${product.priceMax}
        </p>

        {/* Links */}
        <div className="flex items-center gap-3 mb-3">
          <span
            onClick={() => setQuickView({ open: true, mode: 'tests' })}
            className="font-mono text-[10px] text-brass hover:text-brass-dark underline underline-offset-2 transition-colors cursor-pointer"
          >
            View Tests
          </span>
          <span className="text-brass/30">|</span>
          <span
            onClick={() => setQuickView({ open: true, mode: 'coa' })}
            className="font-mono text-[10px] text-brass hover:text-brass-dark underline underline-offset-2 transition-colors cursor-pointer"
          >
            View COA
          </span>
        </div>

        {/* Description — sanitized excerpt, hidden on hover to make room */}
        <p className="font-body text-xs text-saddle/70 leading-relaxed mb-3 flex-1 group-hover:hidden">
          {sanitizeExcerpt(product.description, 120)}
        </p>

        {/* Research Use Only stamp */}
        <div className="border-t border-dashed border-brass/30 pt-3 mb-3">
          <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-saddle/50 text-center">
            ☒ Research Use Only — Not for Human Consumption
          </p>
        </div>

        {/* Add to Cart — ALWAYS VISIBLE for CRO */}
        <button
          onClick={() =>
            addItem({
              id: product.id,
              name: product.name,
              peptideCode: product.peptideCode,
              price: product.priceMin,
              dosage: product.dosage,
            })
          }
          className="w-full bg-espresso text-cream font-display text-[11px] tracking-[0.2em] uppercase py-3 border border-espresso hover:bg-brass hover:text-espresso hover:border-brass transition-all duration-300"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}