import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always show success — never reveal if email exists
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain">
        <div className="relative z-10 max-w-md mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full border-2 border-brass flex items-center justify-center mx-auto mb-4 bg-espresso">
              <span className="font-display text-lg text-brass tracking-widest">VP</span>
            </div>
            <h1 className="font-display text-xl tracking-[0.2em] uppercase text-espresso">
              Reset Password
            </h1>
            <p className="font-body text-sm italic text-saddle mt-2">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <div className="p-6 md:p-8 border border-brass/30 bg-cream/40">
            {sent ? (
              <div className="text-center py-6">
                <span className="w-12 h-12 flex items-center justify-center text-brass mx-auto mb-4">
                  <i className="ri-mail-send-line text-2xl" />
                </span>
                <p className="font-display text-xs tracking-wider uppercase text-espresso mb-2">
                  Check Your Email
                </p>
                <p className="font-body text-xs text-saddle leading-relaxed">
                  If an account exists for <strong className="text-espresso">{email}</strong>,
                  you will receive a password reset link shortly.
                </p>
                <Link
                  to="/login"
                  className="inline-block mt-5 font-display text-[10px] tracking-[0.2em] uppercase text-brass border border-brass/40 px-6 py-2 hover:bg-brass hover:text-espresso transition-all duration-300"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                    Research Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                    placeholder="research@institution.edu"
                  />
                </div>

                {error && (
                  <div className="p-3 border border-red-900/30 bg-red-900/5">
                    <p className="font-mono text-xs text-red-800">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full font-display text-xs tracking-[0.2em] uppercase py-3 border transition-all duration-300 ${
                    submitting
                      ? 'bg-saddle/10 text-saddle/40 border-saddle/20 cursor-not-allowed'
                      : 'bg-brass hover:bg-brass-light text-espresso border-brass hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]'
                  }`}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 border border-saddle/40 border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="font-body text-xs text-saddle hover:text-espresso underline underline-offset-2 transition-colors"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
