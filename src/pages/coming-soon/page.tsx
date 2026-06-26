import { useState, useEffect } from "react";

const PREVIEW_PASSWORD = "vintage2026"; // change this via WP Admin or env var
const STORAGE_KEY = "vp-preview-unlocked";

export default function ComingSoonPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Persist unlock across refreshes
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput.trim().toLowerCase() === PREVIEW_PASSWORD.toLowerCase()) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      setPwError(false);
    } else {
      setPwError(true);
      setPwInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch('/api/crm-subscribe', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email") as string,
          name:  formData.get("name")  as string,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Password gate ─────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-espresso via-walnut to-[#1e1208] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 distressed-overlay opacity-40" />
        <div className="absolute inset-0 vignette-overlay" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />

        <div className="relative z-10 w-full max-w-sm mx-auto px-6 text-center">
          <p className="font-display text-xs tracking-[0.35em] uppercase text-brass mb-4">
            Vintage Peptides
          </p>
          <div className="w-16 mx-auto mb-6 border-t border-brass/30" />
          <h1 className="font-display text-2xl tracking-[0.15em] uppercase text-cream mb-2">
            Private Access
          </h1>
          <p className="font-body text-sm italic text-cream/50 mb-8">
            Enter your access code to continue.
          </p>

          <form onSubmit={handleUnlock} className="flex flex-col gap-3">
            <input
              type="password"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              placeholder="Access code"
              autoComplete="off"
              className="w-full bg-transparent border border-cream/20 text-cream placeholder-cream/30 font-body text-sm px-5 py-4 text-center tracking-widest focus:outline-none focus:border-brass/60 transition-colors duration-300"
            />
            {pwError && (
              <p className="font-mono text-xs text-red-400">Incorrect access code.</p>
            )}
            <button
              type="submit"
              className="w-full bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.25em] uppercase px-10 py-4 border border-brass transition-all duration-300 hover:shadow-[0_0_30px_rgba(184,148,42,0.3)]"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Coming Soon / Email Capture ───────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-espresso via-walnut to-[#1e1208] overflow-hidden flex items-center justify-center">
      {/* Texture overlays */}
      <div className="absolute inset-0 distressed-overlay opacity-40" />
      <div className="absolute inset-0 vignette-overlay" />

      {/* Brass light leaks */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brass/4 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-brass/3 rounded-full blur-[120px]" />

      {/* Top brass line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />

      {/* Decorative corner ornaments */}
      <div className="absolute top-8 left-8 text-brass/20 font-mono text-5xl select-none">❧</div>
      <div className="absolute top-8 right-8 text-brass/20 font-mono text-5xl select-none">❧</div>
      <div className="absolute bottom-8 left-8 text-brass/20 font-mono text-5xl select-none">❧</div>
      <div className="absolute bottom-8 right-8 text-brass/20 font-mono text-5xl select-none">❧</div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 md:px-8 text-center">
        {/* Urgency strip */}
        <div className="inline-flex items-center gap-2 bg-brass/10 border border-brass/30 px-4 py-2 mb-8 animate-fade-in">
          <span className="w-2 h-2 bg-brass rounded-full animate-pulse" />
          <span className="font-mono text-[11px] tracking-wider text-brass uppercase">
            Limited Early Access — Request Invitation
          </span>
        </div>

        {/* Ornamental divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-brass/30" />
          <span className="text-brass text-xl">❧</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-brass/30" />
        </div>

        {/* Headline */}
        <p className="font-display text-xs md:text-sm tracking-[0.35em] uppercase text-brass mb-6 text-shadow-brass">
          The Pursuit Continues
        </p>

        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-[0.12em] uppercase text-cream leading-[1.15] mb-5 text-shadow-dark animate-slide-up">
          Coming
          <br />
          <span className="text-brass italic normal-case tracking-normal text-3xl md:text-5xl lg:text-6xl">
            this summer
          </span>
        </h1>

        <p className="font-body text-base md:text-lg italic text-cream/70 max-w-lg mx-auto leading-relaxed mb-10">
          A new standard in research peptides is taking shape. Pure. Transparent. Relentlessly tested. Be the first to know when we open our doors.
        </p>

        {/* Brass rule */}
        <div className="w-24 mx-auto brass-rule mb-10" />

        {/* Form or Success State */}
        {submitted ? (
          <div className="animate-slide-up max-w-md mx-auto">
            <div className="bg-brass/10 border border-brass/40 p-8">
              <div className="w-16 h-16 mx-auto flex items-center justify-center mb-4">
                <i className="ri-check-line text-brass text-3xl" />
              </div>
              <h2 className="font-display text-lg tracking-[0.15em] uppercase text-cream mb-3">
                You're on the list
              </h2>
              <p className="font-body text-sm italic text-cream/60 leading-relaxed">
                We'll send an invitation to your inbox the moment we launch. No spam. No noise. Just a single email when the doors open.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-slide-up max-w-md mx-auto">
            <form
              id="coming-soon-email"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    className="w-full bg-transparent border border-cream/20 text-cream placeholder-cream/30 font-body text-sm px-5 py-4 focus:outline-none focus:border-brass/60 transition-colors duration-300"
                  />
                </div>
                <div className="flex-1 relative">
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Your Email"
                    className="w-full bg-transparent border border-cream/20 text-cream placeholder-cream/30 font-body text-sm px-5 py-4 focus:outline-none focus:border-brass/60 transition-colors duration-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.25em] uppercase px-10 py-4 border border-brass transition-all duration-300 hover:shadow-[0_0_40px_rgba(184,148,42,0.35)] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 border border-espresso border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Request Early Access"
                )}
              </button>

              {error && (
                <p className="font-mono text-xs text-red-400 mt-1">{error}</p>
              )}

              <p className="font-mono text-[10px] text-cream/25 mt-2">
                We respect your privacy. No spam, ever.
              </p>
            </form>
          </div>
        )}

        {/* Bottom trust row */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-10 border-t border-cream/8 pt-8">
          <div className="text-center">
            <p className="font-mono text-lg text-brass font-bold">99.2%</p>
            <p className="font-display text-[9px] tracking-[0.2em] uppercase text-cream/40 mt-1">Target Purity</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg text-brass font-bold">USA</p>
            <p className="font-display text-[9px] tracking-[0.2em] uppercase text-cream/40 mt-1">Lyophilized</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg text-brass font-bold">COA</p>
            <p className="font-display text-[9px] tracking-[0.2em] uppercase text-cream/40 mt-1">Every Batch</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg text-brass font-bold">3<sup>rd</sup> Party</p>
            <p className="font-display text-[9px] tracking-[0.2em] uppercase text-cream/40 mt-1">Verified</p>
          </div>
        </div>
      </div>
    </div>
  );
}
