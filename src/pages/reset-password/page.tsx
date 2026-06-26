import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const key = searchParams.get('key') || '';
  const login = searchParams.get('login') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Invalid link guard
  if (!key || !login) {
    return (
      <PageLayout>
        <div className="py-16 md:py-24 parchment-grain">
          <div className="relative z-10 max-w-md mx-auto px-4 md:px-8 text-center">
            <span className="w-12 h-12 flex items-center justify-center text-red-700/60 mx-auto mb-4">
              <i className="ri-error-warning-line text-2xl" />
            </span>
            <h1 className="font-display text-xl tracking-[0.2em] uppercase text-espresso mb-2">
              Invalid Link
            </h1>
            <p className="font-body text-sm text-saddle mb-6">
              This password reset link is missing or malformed.
            </p>
            <Link
              to="/forgot-password"
              className="font-display text-[10px] tracking-[0.2em] uppercase text-brass border border-brass/40 px-6 py-2.5 hover:bg-brass hover:text-espresso transition-all duration-300"
            >
              Request a New Link
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', key, login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Reset failed. Your link may have expired.');
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
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
            <img
              src="https://db.vintagepeptides.com/wp-content/uploads/2026/06/WhatsApp_Image_2026-06-17_at_15.47.54-removebg-preview.png"
              alt="Vintage Peptides"
              className="h-14 w-auto object-contain mx-auto mb-4"
            />
            <h1 className="font-display text-xl tracking-[0.2em] uppercase text-espresso">
              Set New Password
            </h1>
            <p className="font-body text-sm italic text-saddle mt-2">
              Choose a strong password for your account.
            </p>
          </div>

          <div className="p-6 md:p-8 border border-brass/30 bg-cream/40">
            {success ? (
              <div className="text-center py-6">
                <span className="w-12 h-12 flex items-center justify-center text-brass mx-auto mb-4">
                  <i className="ri-check-line text-2xl" />
                </span>
                <p className="font-display text-xs tracking-wider uppercase text-espresso mb-2">
                  Password Updated
                </p>
                <p className="font-body text-xs text-saddle">
                  Your password has been reset. Redirecting to login…
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                    placeholder="Min. 8 characters"
                  />
                </div>

                <div>
                  <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                    placeholder="••••••••"
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
                      Updating…
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
