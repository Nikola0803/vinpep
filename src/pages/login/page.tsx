import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        return;
      }

      // Store basic user info in sessionStorage for display purposes
      sessionStorage.setItem('vp_user', JSON.stringify({
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
      }));

      navigate('/shop');
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
              Research Access
            </h1>
            <p className="font-body text-sm italic text-saddle mt-2">
              Login to access the catalog and your research order history.
            </p>
          </div>

          <div className="p-6 md:p-8 border border-brass/30 bg-cream/40">
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
              <div>
                <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    Logging in…
                  </span>
                ) : (
                  'Login'
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="font-body text-xs text-saddle hover:text-brass underline underline-offset-2 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-brass/20 text-center">
              <p className="font-body text-xs text-saddle">
                Need research access?{' '}
                <Link to="/register" className="text-brass hover:text-brass-dark underline underline-offset-2 transition-colors">
                  Request an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
