import { useState } from 'react';
import PageLayout from '@/components/feature/PageLayout';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain">
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-espresso mt-3">
              Contact Our Research Team
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
                    <i className="ri-map-pin-line" />
                  </span>
                  <div>
                    <p className="text-espresso font-medium">Headquarters</p>
                    <p>247 Research Way, Suite 400</p>
                    <p>Boston, MA 02118</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-brass flex-shrink-0 mt-0.5">
                    <i className="ri-phone-line" />
                  </span>
                  <div>
                    <p className="text-espresso font-medium">Research Support</p>
                    <p>(866) 788-GLP1</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-brass flex-shrink-0 mt-0.5">
                    <i className="ri-mail-line" />
                  </span>
                  <div>
                    <p className="text-espresso font-medium">Email</p>
                    <p>research@vintagepeptides.com</p>
                  </div>
                </div>
              </div>

              <div className="brass-rule max-w-xs my-8" />

              <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-4">
                Laboratory Hours
              </h2>
              <div className="font-body text-sm text-saddle space-y-2">
                <div className="flex justify-between max-w-xs">
                  <span>Monday – Friday</span>
                  <span>9:00 AM – 6:00 PM EST</span>
                </div>
                <div className="flex justify-between max-w-xs">
                  <span>Saturday</span>
                  <span>10:00 AM – 2:00 PM EST</span>
                </div>
                <div className="flex justify-between max-w-xs">
                  <span>Sunday</span>
                  <span>Closed</span>
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
                    Message Received
                  </h3>
                  <p className="font-body text-sm text-saddle">
                    Our research team will respond within 24 hours.
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
                      className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors"
                      placeholder="University / Laboratory"
                    />
                  </div>
                  <div>
                    <label className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso block mb-1.5">
                      Email
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
                      Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      maxLength={500}
                      className="w-full bg-parchment border border-brass/40 py-2.5 px-3 font-body text-sm text-espresso placeholder:text-saddle/50 focus:outline-none focus:border-brass transition-colors resize-none"
                      placeholder="How can our research team assist you?"
                    />
                    <p className="font-mono text-[10px] text-saddle/50 mt-1 text-right">Max 500 characters</p>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 border border-brass transition-all duration-300 hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]"
                  >
                    Send Message
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