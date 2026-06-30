import { useState, useRef } from 'react';
import PageLayout from '@/components/feature/PageLayout';
import { useSections } from '@/context/SectionsContext';

export default function Contact() {
  const { sections } = useSections();
  const s = sections.contact_page;

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);

    const payload = {
      name:        String(fd.get('name') ?? '').trim(),
      email:       String(fd.get('email') ?? '').trim(),
      institution: String(fd.get('institution') ?? '').trim(),
      message:     String(fd.get('message') ?? '').trim(),
    };

    try {
      // Single call through Vercel proxy — handles CRM save + admin notification server-side
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain">
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-espresso mt-3">
              {s.heading}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Contact info */}
            <div>
              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-6">
                Direct Contact
              </h2>
              <div className="space-y-5 font-body text-sm text-saddle">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-brass flex-shrink-0 mt-0.5">
                    <i className="ri-phone-line" />
                  </span>
                  <div>
                    <p className="text-espresso font-medium">{s.phone_label}</p>
                    <p>{s.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-brass flex-shrink-0 mt-0.5">
                    <i className="ri-mail-line" />
                  </span>
                  <div>
                    <p className="text-espresso font-medium">{s.email_label}</p>
                    <p>{s.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 md:p-8 border border-brass/30 bg-cream/40">
              {submitted ? (
                <div className="text-center py-8">
                  <span className="w-12 h-12 flex items-center justify-center text-brass mx-auto mb-4">
                    <i className="ri-check-line text-2xl" />
                  </span>
                  <h3 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-2">
                    {s.success_heading}
                  </h3>
                  <p className="font-body text-sm text-saddle">
                    {s.success_body}
                  </p>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                      Full Name
                    </label>
                    <input
                      name="name"
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
                      name="institution"
                      type="text"
                      className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                      placeholder="University / Laboratory"
                    />
                  </div>
                  <div>
                    <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                      placeholder="research@institution.edu"
                    />
                  </div>
                  <div>
                    <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                      Message
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      required
                      maxLength={500}
                      className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors resize-none"
                      placeholder="How can our research team assist you?"
                    />
                    <p className="font-mono text-[10px] text-saddle/50 mt-1 text-right">Max 500 characters</p>
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
                    ) : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
