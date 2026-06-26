import { useState } from 'react';
import { useAgeGate } from '../../hooks/useAgeGate';

const LOGO = 'https://db.vintagepeptides.com/wp-content/uploads/2026/06/WhatsApp_Image_2026-06-17_at_15.47.54-removebg-preview.png';

// Set to '' to disable the password gate (e.g. when site goes fully public).
// Change this value and redeploy to open/close access.
const LAUNCH_PASSWORD = import.meta.env.VITE_LAUNCH_PASSWORD ?? 'vintage2026';
const PASSWORD_REQUIRED = LAUNCH_PASSWORD.length > 0;

export default function AgeGate() {
  const { isConfirmed, confirm, exit } = useAgeGate();
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isConfirmed === null || isConfirmed === true) return null;

  const handleEnter = async () => {
    if (!checked || submitting) return;

    // Password gate check
    if (PASSWORD_REQUIRED && password.trim().toLowerCase() !== LAUNCH_PASSWORD.toLowerCase()) {
      setPwError(true);
      return;
    }

    setSubmitting(true);

    // Fire-and-forget email capture — never blocks entry
    if (email && email.includes('@')) {
      fetch('/api/crm-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      }).catch(() => {/* silent */});
    }

    confirm();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
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

        {/* Age checkbox */}
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

        {/* Fields — only show when age checkbox is ticked */}
        {checked && (
          <div className="space-y-3 mb-5">
            {/* Email — optional */}
            <div>
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso mb-1.5">
                Get early access alerts{' '}
                <span className="font-body normal-case tracking-normal text-saddle/50">(optional)</span>
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
              />
            </div>

            {/* Password — required while LAUNCH_PASSWORD is set */}
            {PASSWORD_REQUIRED && (
              <div>
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso mb-1.5">
                  Access Code <span className="font-body normal-case tracking-normal text-red-700/70">(required)</span>
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                  placeholder="Enter access code"
                  autoFocus
                  className={`w-full bg-parchment border font-body text-sm text-espresso py-2.5 px-3 focus:outline-none placeholder:text-saddle/40 transition-colors ${
                    pwError ? 'border-red-700/60 focus:border-red-700' : 'border-brass/40 focus:border-brass'
                  }`}
                />
                {pwError && (
                  <p className="font-mono text-xs text-red-700 mt-1">Incorrect access code.</p>
                )}
              </div>
            )}
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

        {PASSWORD_REQUIRED && (
          <p className="text-center font-body text-[10px] text-saddle/40 mt-4">
            Private preview — access by invitation only
          </p>
        )}
      </div>
    </div>
  );
}
