import { useState } from 'react';
import { CartProvider } from './context/CartContext';
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
      <CartProvider>
        <BrowserRouter basename={__BASE_PATH__}>
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
        </BrowserRouter>
      </CartProvider>
    </I18nextProvider>
  );
}

export default App;
