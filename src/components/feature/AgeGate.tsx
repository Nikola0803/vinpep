import { useState } from 'react';
import { useAgeGate } from '../../hooks/useAgeGate';

const LOGO = 'https://db.vintagepeptides.com/wp-content/uploads/2026/06/WhatsApp_Image_2026-06-17_at_15.47.54-removebg-preview.png';

export default function AgeGate() {
  const { isConfirmed, confirm, exit } = useAgeGate();
  const [checked, setChecked] = useState(false);
  const [phase, setPhase] = useState<'gate' | 'signup'>('gate');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (isConfirmed === null || isConfirmed === true) return null;

  const handleConfirmAge = () => {
    setPhase('signup');
  };

  const handleSubscribeAndEnter = async () => {
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/crm-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
      setTimeout(() => confirm(), 1200);
    } catch {
      confirm(); // non-fatal — still let them in
    } finally {
      setSubmitting(false);
    }
  };

  // ── Phase 2: Soft signup ──────────────────────────────────────────────────────
  if (phase === 'signup') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-parchment brass-double-border p-8 md:p-10 shadow-2xl">
          <div className="flex justify-center mb-6">
            <img src={LOGO} alt="Vintage Peptides" className="h-16 w-auto object-contain" />
          </div>

          {subscribed ? (
            <div className="text-center py-4">
              <i className="ri-check-line text-brass text-3xl mb-3 block" />
              <p className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-1">You're on the list</p>
              <p className="font-body text-xs italic text-saddle">Entering the site…</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-center text-base tracking-[0.2em] uppercase text-espresso mb-2">
                Stay in the Loop
              </h2>
              <div className="flex justify-center mb-4">
                <span className="text-brass text-lg">❧</span>
              </div>
              <p className="font-body text-sm text-center text-saddle leading-relaxed mb-6">
                Get early access alerts, batch announcements, and exclusive research updates — no spam, ever.
              </p>

              <div className="space-y-3 mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscribeAndEnter()}
                  placeholder="your@email.com"
                  className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-3 px-4 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                />
                <button
                  onClick={handleSubscribeAndEnter}
                  disabled={!email || submitting}
                  className={`w-full font-display text-xs tracking-[0.2em] uppercase py-3 border transition-all duration-300 ${
                    email && !submitting
                      ? 'bg-brass hover:bg-brass-light text-espresso border-brass hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]'
                      : 'bg-saddle/10 text-saddle/40 border-saddle/20 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 border border-saddle/40 border-t-transparent rounded-full animate-spin" />
                      Subscribing…
                    </span>
                  ) : 'Notify Me & Enter Site'}
                </button>
              </div>

              <button
                onClick={confirm}
                className="w-full text-center font-body text-xs text-saddle/60 hover:text-saddle transition-colors py-2"
              >
                Skip, enter site →
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Phase 1: Age gate ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-parchment brass-double-border p-8 md:p-10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <img src={LOGO} alt="Vintage Peptides" className="h-20 w-auto object-contain" />
        </div>

        <h2 className="font-display text-center text-lg tracking-[0.2em] uppercase text-espresso mb-2">
          Age Verification
        </h2>

        <div className="flex justify-center mb-5">
          <span className="text-brass text-lg">❧</span>
        </div>

        <p className="font-body text-sm text-center text-saddle leading-relaxed mb-6">
          You must be at least <strong className="text-espresso">21 years of age</strong> to enter
          this website. All products are sold strictly for{' '}
          <strong className="text-espresso">laboratory research use only</strong> and are not for
          human consumption.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 accent-brass cursor-pointer"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span className="font-body text-xs text-saddle leading-relaxed">
              I confirm that I am 21 years of age or older and that all products purchased will be
              used for lawful research purposes only.
            </span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleConfirmAge}
            disabled={!checked}
            className={`flex-1 font-display text-xs tracking-[0.2em] uppercase py-3 px-6 border transition-all duration-300 ${
              checked
                ? 'bg-brass hover:bg-brass-light text-espresso border-brass hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]'
                : 'bg-saddle/10 text-saddle/40 border-saddle/20 cursor-not-allowed'
            }`}
          >
            I Confirm
          </button>
          <button
            onClick={exit}
            className="flex-1 bg-transparent text-saddle hover:text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 px-6 border border-saddle/30 hover:border-espresso transition-all duration-300"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
