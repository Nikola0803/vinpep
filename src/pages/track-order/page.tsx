import { useState } from 'react';
import PageLayout from '@/components/feature/PageLayout';

interface TrackResult {
  found:        boolean;
  invoiceId?:   string;
  wcOrderId?:   number;
  status?:      string;
  statusLabel?: string;
  dateCreated?: string;
  items?:       { name: string; quantity: number; total: string }[];
  total?:       string;
  tracking?:    string | null;
  carrier?:     string | null;
  shipDate?:    string | null;
  trackingUrl?: string | null;
  memo?:        string | null;
  message?:     string;
}

const STATUS_ICON: Record<string, string> = {
  pending:    'ri-time-line',
  processing: 'ri-settings-3-line',
  completed:  'ri-checkbox-circle-line',
  cancelled:  'ri-close-circle-line',
  'on-hold':  'ri-pause-circle-line',
};

const STATUS_COLOR: Record<string, string> = {
  pending:    'text-amber-600',
  processing: 'text-blue-600',
  completed:  'text-green-700',
  cancelled:  'text-red-700',
  'on-hold':  'text-saddle',
};

export default function TrackOrder() {
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState<TrackResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/track-order?q=${encodeURIComponent(q)}`);
      const data: TrackResult = await res.json();

      if (res.status === 404 || !data.found) {
        setResult({ found: false, message: data.message || 'Order not found.' });
      } else if (!res.ok) {
        setError((data as { error?: string }).error || 'Lookup failed. Please try again.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain">
        <div className="relative z-10 max-w-xl mx-auto px-4 md:px-8">

          <div className="text-center mb-10">
            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-espresso mt-3">
              Track Your Order
            </h1>
            <p className="font-body text-sm italic text-saddle mt-3">
              Enter your invoice ID (VTG-...) or order number.
            </p>
          </div>

          {/* Search form */}
          <div className="p-6 md:p-8 border border-brass/30 bg-cream/40 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                  Invoice ID or Order Number
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                  placeholder="VTG-1718000000-V3K9"
                  className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-mono text-sm text-espresso placeholder:text-saddle/40 focus:outline-none focus:border-brass transition-colors"
                />
              </div>
              <button type="submit" disabled={loading}
                className={`w-full font-display text-xs tracking-[0.2em] uppercase py-3 border transition-all duration-300 ${
                  loading
                    ? 'bg-saddle/10 text-saddle/40 border-saddle/20 cursor-not-allowed'
                    : 'bg-brass hover:bg-brass-light text-espresso border-brass hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]'
                }`}>
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-saddle/40 border-t-transparent rounded-full animate-spin" />
                    Looking up...
                  </span>
                ) : 'Track Order'}
              </button>
            </form>

            {error && (
              <p className="font-mono text-xs text-red-700 mt-4">{error}</p>
            )}
          </div>

          {/* Results */}
          {result && (
            result.found ? (
              <div className="border border-brass/20 bg-cream/40 p-6 space-y-5">

                {/* Status header */}
                <div className="flex items-center gap-3 pb-4 border-b border-brass/20">
                  <span className={`text-2xl ${STATUS_COLOR[result.status!] || 'text-saddle'}`}>
                    <i className={STATUS_ICON[result.status!] || 'ri-file-list-3-line'} />
                  </span>
                  <div>
                    <p className="font-display text-xs tracking-[0.2em] uppercase text-espresso">
                      {result.statusLabel}
                    </p>
                    <p className="font-mono text-[10px] text-saddle/60 mt-0.5">{result.invoiceId}</p>
                  </div>
                  <span className="ml-auto font-mono text-lg text-brass font-bold">
                    ${parseFloat(result.total || '0').toFixed(2)}
                  </span>
                </div>

                {/* Tracking */}
                {result.tracking ? (
                  <div className="p-4 bg-brass/5 border border-brass/30 text-center">
                    <p className="font-display text-[9px] tracking-[0.25em] uppercase text-saddle mb-1">
                      Tracking Number
                    </p>
                    <p className="font-mono text-xl text-brass font-bold tracking-wider mb-1">
                      {result.tracking}
                    </p>
                    <p className="font-body text-xs text-saddle/60 mb-3">
                      {result.carrier}{result.shipDate ? ` · Shipped ${new Date(result.shipDate).toLocaleDateString()}` : ''}
                    </p>
                    {result.trackingUrl && (
                      <a href={result.trackingUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-block bg-brass text-espresso font-display text-[10px] tracking-[0.2em] uppercase px-6 py-2.5 border border-brass hover:bg-brass-light transition-colors">
                        Track Package
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-cream/60 border border-brass/10 text-center">
                    <i className="ri-truck-line text-brass/40 text-xl block mb-2" />
                    <p className="font-body text-sm italic text-saddle/60">
                      Tracking information will appear here once your order ships.
                    </p>
                  </div>
                )}

                {/* Items */}
                {result.items && result.items.length > 0 && (
                  <div>
                    <p className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle mb-3">
                      Order Contents
                    </p>
                    <div className="space-y-2">
                      {result.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-brass/10 last:border-0">
                          <span className="font-body text-sm text-espresso">
                            {item.name} <span className="text-saddle/50 text-xs">×{item.quantity}</span>
                          </span>
                          <span className="font-mono text-xs text-brass">
                            ${parseFloat(item.total).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="font-mono text-[10px] text-saddle/40 text-center">
                  Questions? Contact research@vintagepeptides.com with your invoice ID.
                </p>
              </div>
            ) : (
              <div className="border border-brass/20 bg-cream/40 p-8 text-center">
                <i className="ri-search-line text-saddle/30 text-3xl block mb-3" />
                <p className="font-display text-xs tracking-wider uppercase text-espresso mb-2">
                  Order Not Found
                </p>
                <p className="font-body text-sm text-saddle">
                  {result.message || 'Please verify your invoice ID and try again.'}
                </p>
              </div>
            )
          )}

        </div>
      </div>
    </PageLayout>
  );
}