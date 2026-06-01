import { useState } from 'react';
import PageLayout from '@/components/feature/PageLayout';

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<null | { found: boolean; status: string }>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim().toUpperCase() === 'VP-2026-001') {
      setResult({ found: true, status: 'Shipped — In Transit (FedEx 2-Day)' });
    } else if (orderId.trim().toUpperCase() === 'VP-2026-002') {
      setResult({ found: true, status: 'Processing — Quality Control Review' });
    } else {
      setResult({ found: false, status: '' });
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
              Enter your order number to check the status of your shipment.
            </p>
          </div>

          <div className="p-6 md:p-8 border border-brass/30 bg-cream/40">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                  Order Number
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                  placeholder="VP-2026-XXXX"
                  className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-mono text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors uppercase"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 border border-brass transition-all duration-300 hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]"
              >
                Track Order
              </button>
            </form>

            {result && (
              <div className="mt-6 pt-6 border-t border-brass/20">
                {result.found ? (
                  <div className="text-center">
                    <span className="w-10 h-10 flex items-center justify-center text-brass mx-auto mb-3">
                      <i className="ri-check-line text-xl" />
                    </span>
                    <p className="font-display text-xs tracking-wider uppercase text-espresso mb-1">
                      Order Found
                    </p>
                    <p className="font-body text-sm text-saddle">{result.status}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="w-10 h-10 flex items-center justify-center text-saddle mx-auto mb-3">
                      <i className="ri-close-line text-xl" />
                    </span>
                    <p className="font-display text-xs tracking-wider uppercase text-espresso mb-1">
                      Order Not Found
                    </p>
                    <p className="font-body text-sm text-saddle">
                      Please verify your order number and try again. Contact support if you need assistance.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}