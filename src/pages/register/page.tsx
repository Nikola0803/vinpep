import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    institution: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!ageConfirmed) {
      setError('You must confirm you are 21 or older.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          institution: form.institution,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
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
            <div className="w-16 h-16 rounded-full border-2 border-brass flex items-center justify-center mx-auto mb-4 bg-espresso">
              <span className="font-display text-lg text-brass tracking-widest">VP</span>
            </div>
            <h1 className="font-display text-xl tracking-[0.2em] uppercase text-espresso">
              Request Research Access
            </h1>
            <p className="font-body text-sm italic text-saddle mt-2">
              Create an account to browse our catalog and manage your research orders.
            </p>
          </div>

          <div className="p-6 md:p-8 border border-brass/30 bg-cream/40">
            {success ? (
              <div className="text-center py-6">
                <span className="w-12 h-12 flex items-center justify-center text-brass mx-auto mb-4">
                  <i className="ri-check-line text-2xl" />
                </span>
                <p className="font-display text-xs tracking-wider uppercase text-espresso mb-2">
                  Account Created
                </p>
                <p className="font-body text-xs text-saddle leading-relaxed">
                  Your account has been created. Check your email for a confirmation
                  message. Redirecting to login…
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={set('firstName')}
                      className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={set('lastName')}
                      className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                      placeholder="Researcher"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={form.institution}
                    onChange={set('institution')}
                    className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                    placeholder="University / Laboratory"
                  />
                </div>

                <div>
                  <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                    Research Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={set('email')}
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
                    value={form.password}
                    onChange={set('password')}
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
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-brass flex-shrink-0"
                  />
                  <span className="font-body text-xs text-saddle leading-relaxed">
                    I confirm that I am{' '}
                    <strong className="text-espresso">21 years of age or older</strong> and
                    that all products will be used for lawful laboratory research purposes only.
                  </span>
                </label>

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
                      Creating Account…
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-brass/20 text-center space-y-2">
              <p className="font-body text-xs text-saddle">
                Already have access?{' '}
                <Link to="/login" className="text-brass hover:text-brass-dark underline underline-offset-2 transition-colors">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
