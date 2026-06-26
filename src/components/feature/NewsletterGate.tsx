import { useState } from 'react';

const LOGO = 'https://db.vintagepeptides.com/wp-content/uploads/2026/06/WhatsApp_Image_2026-06-17_at_15.47.54-removebg-preview.png';

interface Props {
  onComplete: () => void;
}

export default function NewsletterGate({ onComplete }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/crm-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
    } catch { /* non-fatal */ }
    setDone(true);
    setTimeout(onComplete, 1400);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-parchment brass-double-border p-8 md:p-10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <img src={LOGO} alt="Vintage Peptides" className="h-16 w-auto object-contain" />
        </div>

        {done ? (
          <div className="text-center py-4">
            <i className="ri-check-line text-brass text-3xl mb-3 block" />
            <p className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-1">You're on the list</p>
            <p className="font-body text-xs italic text-saddle">Continuing to site…</p>
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
              Get batch announcements, early access alerts, and exclusive research updates. No spam — ever.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3 mb-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
              />
              <button
                type="submit"
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
                ) : 'Notify Me'}
              </button>
            </form>

            <button
              onClick={onComplete}
              className="w-full text-center font-body text-xs text-saddle/50 hover:text-saddle transition-colors py-1"
            >
              Skip →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
