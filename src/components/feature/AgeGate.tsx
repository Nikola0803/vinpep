import { useState } from 'react';
import { useAgeGate } from '../../hooks/useAgeGate';

const LOGO = 'https://db.vintagepeptides.com/wp-content/uploads/2026/06/WhatsApp_Image_2026-06-17_at_15.47.54-removebg-preview.png';

export default function AgeGate() {
  const { isConfirmed, confirm, exit } = useAgeGate();
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isConfirmed === null || isConfirmed === true) return null;

  const handleEnter = async () => {
    if (!checked || submitting) return;
    setSubmitting(true);

    if (email && email.includes('@')) {
      fetch('/api/crm-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      }).catch(() => {});
    }

    confirm();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
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

        <label className="flex items-start gap-3 cursor-pointer mb-5">
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

        {checked && (
          <div className="mb-5">
            <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso mb-1.5">
              Get early access alerts{' '}
              <span className="font-body normal-case tracking-normal text-saddle/50">(optional)</span>
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
              placeholder="your@email.com"
              autoFocus
              className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleEnter}
            disabled={!checked || submitting}
            className={`flex-1 font-display text-xs tracking-[0.2em] uppercase py-3 px-6 border transition-all duration-300 ${
              checked && !submitting
                ? 'bg-brass hover:bg-brass-light text-espresso border-brass hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]'
                : 'bg-saddle/10 text-saddle/40 border-saddle/20 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 border border-saddle/40 border-t-transparent rounded-full animate-spin" />
                Entering…
              </span>
            ) : 'Enter Site'}
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
