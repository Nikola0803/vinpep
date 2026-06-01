import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';

export default function Register() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
            {submitted ? (
              <div className="text-center py-4">
                <span className="w-10 h-10 flex items-center justify-center text-brass mx-auto mb-3">
                  <i className="ri-check-line text-xl" />
                </span>
                <p className="font-display text-xs tracking-wider uppercase text-espresso mb-1">
                  Request Submitted
                </p>
                <p className="font-body text-xs text-saddle">
                  Supabase connection needed for full registration. This is a visual placeholder.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                    placeholder="Dr. Jane Researcher"
                  />
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                    Institution
                  </label>
                  <input
                    type="text"
                    required
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
                    className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" required className="mt-1 w-4 h-4 accent-brass" />
                  <span className="font-body text-xs text-saddle leading-relaxed">
                    I confirm that I am 21 years of age or older and that all products will be used for lawful laboratory research purposes only.
                  </span>
                </div>
                <button
                  type="submit"
                  className="w-full bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 border border-brass transition-all duration-300 hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]"
                >
                  Request Account
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-brass/20 text-center">
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