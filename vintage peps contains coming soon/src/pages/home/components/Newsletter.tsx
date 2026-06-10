import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-16 md:py-20 bg-cream bg-cream-grain">
      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 text-center">
        <span className="text-brass text-lg">❧</span>
        <h2 className="font-display text-lg md:text-xl tracking-[0.2em] uppercase text-espresso mt-3 mb-3">
          Join the Archive
        </h2>
        <p className="font-body text-sm italic text-saddle mb-8 max-w-lg mx-auto">
          Receive batch announcements, testing reports, and research protocols delivered directly to your inbox.
        </p>

        {submitted ? (
          <div className="p-6 border border-brass bg-parchment">
            <span className="w-8 h-8 flex items-center justify-center text-brass mx-auto mb-3">
              <i className="ri-check-line text-xl" />
            </span>
            <p className="font-display text-sm tracking-wider uppercase text-espresso">
              Welcome to the Archive
            </p>
            <p className="font-body text-xs text-saddle mt-2">
              Your subscription has been confirmed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your research email"
              required
              className="flex-1 bg-parchment border border-brass py-3 px-4 font-body text-sm text-espresso placeholder:text-saddle/60 focus:outline-none focus:border-brass-light transition-colors"
            />
            <button
              type="submit"
              className="bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 px-8 border border-brass transition-all duration-300 hover:shadow-[0_0_15px_rgba(184,148,42,0.3)] whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        )}

        <p className="font-body text-[10px] text-saddle/50 mt-4">
          We respect your privacy. Unsubscribe at any time. Research use only communications.
        </p>
      </div>
    </section>
  );
}