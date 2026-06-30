import { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { SectionsProvider, useSections } from './context/SectionsContext';
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import CartDrawer from "./components/feature/CartDrawer";
import FloatingCtaBar from "./components/feature/FloatingCtaBar";
import ScrollToTop from "./components/ScrollToTop";
import AgeGate from "./components/feature/AgeGate";
import IntroVideo from "./components/feature/IntroVideo";
import NewsletterGate from "./components/feature/NewsletterGate";

// ── CMS status indicator (dev only) ──────────────────────────────────────────
function CMSBadge() {
  const { fromCMS, loading } = useSections();
  if (import.meta.env.PROD) return null;
  return (
    <div style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 9999, fontSize: 11,
      padding: '3px 8px', borderRadius: 4, background: loading ? '#888' : fromCMS ? '#166534' : '#92400e',
      color: '#fff', fontFamily: 'monospace', pointerEvents: 'none' }}>
      {loading ? '⏳ CMS…' : fromCMS ? '✓ CMS Live' : '⚠ Fallback'}
    </div>
  );
}

// ── Maintenance gate ──────────────────────────────────────────────────────────
function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { sections, loading } = useSections();
  if (loading) return null; // brief flash prevention — defaults render instantly anyway
  if (sections._maintenance) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#1a0f00', color: '#c8a96e', fontFamily: 'Georgia, serif', textAlign: 'center', padding: 40 }}>
        <div>
          <p style={{ fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 16 }}>
            Vintage Peptides
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, marginBottom: 12 }}>Site Temporarily Unavailable</h1>
          <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 400 }}>
            This site is currently undergoing maintenance. Please check back soon or contact your administrator.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

// Flow: 'video' → 'newsletter' → 'site'
// sessionStorage preserves progress across hard refreshes within the session.
function getInitialStep(): 'video' | 'newsletter' | 'site' {
  if (sessionStorage.getItem('vp_newsletter_shown')) return 'site';
  if (sessionStorage.getItem('vp_intro_played')) return 'newsletter';
  return 'video';
}

function App() {
  const [step, setStep] = useState<'video' | 'newsletter' | 'site'>(getInitialStep);

  const handleVideoComplete = () => {
    sessionStorage.setItem('vp_intro_played', '1');
    setStep('newsletter');
  };

  const handleNewsletterComplete = () => {
    sessionStorage.setItem('vp_newsletter_shown', '1');
    setStep('site');
  };

  return (
    <I18nextProvider i18n={i18n}>
      <SectionsProvider>
        <CartProvider>
          <BrowserRouter basename={__BASE_PATH__}>
            <MaintenanceGate>
              <ScrollToTop />

              {/* Step 1 — video + access code gate */}
              {step === 'video' && (
                <IntroVideo onComplete={handleVideoComplete} />
              )}

              {/* Step 2 — newsletter signup */}
              {step === 'newsletter' && (
                <NewsletterGate onComplete={handleNewsletterComplete} />
              )}

              {/* Step 3 — age confirmation (has its own 30-day cookie logic) */}
              {step === 'site' && <AgeGate />}

              <AppRoutes />
              <CartDrawer />
              <FloatingCtaBar />
            </MaintenanceGate>
            <CMSBadge />
          </BrowserRouter>
        </CartProvider>
      </SectionsProvider>
    </I18nextProvider>
  );
}

export default App;
