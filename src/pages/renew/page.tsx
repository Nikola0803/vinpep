import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';
import { useCart } from '@/context/CartContext';

interface RenewalItem {
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  discounted_price: number;
}

interface RenewalDetails {
  subscription_id: number;
  status: string;
  customer_name: string;
  customer_email: string;
  items: RenewalItem[];
  interval_days: number;
  discount_pct: number;
  subtotal: number;
  next_renewal: string;
  wc_order_id: number | null;
}

const WP_URL = import.meta.env.VITE_WC_URL || 'https://db.vintagepeptides.com';

export default function RenewPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, clearCart } = useCart();

  const [details, setDetails] = useState<RenewalDetails | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);

  const sub   = params.get('sub');
  const token = params.get('token');
  const exp   = params.get('exp');

  useEffect(() => {
    if ( !sub || !token || !exp ) {
      setError('Invalid renewal link — missing parameters.');
      setLoading(false);
      return;
    }
    const url = `${WP_URL}/wp-json/vps/v1/renewal?sub=${sub}&token=${encodeURIComponent(token)}&exp=${exp}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.message || 'Invalid or expired link.'));
        return r.json();
      })
      .then((data: RenewalDetails) => {
        if (data.status === 'cancelled') {
          setError('This subscription has been cancelled.');
        } else {
          setDetails(data);
        }
      })
      .catch((msg) => setError(typeof msg === 'string' ? msg : 'Could not load renewal details.'))
      .finally(() => setLoading(false));
  }, [sub, token, exp]);

  function handleProceed() {
    if (!details) return;
    setAdding(true);
    clearCart();
    details.items.forEach((item) => {
      addItem({
        id: `sub-${details.subscription_id}-${item.sku}`,
        name: item.name,
        peptideCode: item.sku,
        price: item.discounted_price,
        dosage: '',
        subscribeInterval: details.interval_days as 30 | 60 | 90 | 180,
        subscriptionDiscountPct: details.discount_pct,
      });
      // Set quantity > 1 if needed — addItem adds 1 per call
      for (let q = 1; q < item.quantity; q++) {
        addItem({
          id: `sub-${details.subscription_id}-${item.sku}`,
          name: item.name,
          peptideCode: item.sku,
          price: item.discounted_price,
          dosage: '',
        });
      }
    });
    navigate('/checkout');
  }

  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain min-h-screen">
        <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <span className="text-brass text-lg">↻</span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-espresso mt-3">
              Renewal Ready
            </h1>
          </div>

          {loading && (
            <div className="text-center py-20">
              <p className="font-mono text-sm text-saddle animate-pulse tracking-widest uppercase">Loading your renewal…</p>
            </div>
          )}

          {error && (
            <div className="border border-red-900/20 bg-red-900/[0.03] p-6 text-center">
              <p className="font-mono text-sm text-red-900/80">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 font-mono text-[11px] tracking-[0.2em] uppercase text-brass hover:text-espresso transition-colors"
              >
                Return to Shop →
              </button>
            </div>
          )}

          {details && (
            <div className="space-y-6">
              {/* Header info */}
              <div className="border border-brass/20 bg-cream/40 p-5">
                <p className="font-display text-xs tracking-[0.2em] uppercase text-espresso mb-3">Subscription #{details.subscription_id}</p>
                <div className="grid grid-cols-3 gap-4 font-mono text-xs text-saddle">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-saddle/50 mb-1">Interval</p>
                    <p>Every {details.interval_days} days</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-saddle/50 mb-1">Discount</p>
                    <p className="text-brass">{details.discount_pct}% off</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-saddle/50 mb-1">Order</p>
                    <p>#{details.wc_order_id ?? '—'}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border border-brass/20">
                <div className="border-b border-brass/20 px-5 py-3 bg-cream/20">
                  <p className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso">Renewal Items</p>
                </div>
                {details.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-brass/10 last:border-0">
                    <div>
                      <p className="font-display text-xs tracking-wider text-espresso">{item.name}</p>
                      <p className="font-mono text-[10px] text-saddle/50 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-espresso font-bold">
                        ${(item.discounted_price * item.quantity).toFixed(2)}
                      </p>
                      <p className="font-mono text-[10px] text-saddle/40 line-through">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-4 bg-cream/30">
                  <p className="font-display text-xs tracking-[0.15em] uppercase text-espresso">Total</p>
                  <p className="font-mono text-base text-brass font-bold">
                    ${details.items.reduce((s, i) => s + i.discounted_price * i.quantity, 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleProceed}
                disabled={adding || details.status === 'cancelled'}
                className="w-full bg-espresso text-cream font-display text-[11px] tracking-[0.2em] uppercase py-4 border border-espresso hover:bg-brass hover:text-espresso hover:border-brass transition-all duration-300 disabled:opacity-50"
              >
                {adding ? 'Preparing Checkout…' : 'Complete Renewal →'}
              </button>

              <p className="font-mono text-[10px] text-center text-saddle/40 tracking-wider">
                Your cart will be pre-filled with the items above at the subscriber rate.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
