import { CartProvider } from './context/CartContext';
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import CartDrawer from "./components/feature/CartDrawer";
import FloatingCtaBar from "./components/feature/FloatingCtaBar";
import ScrollToTop from "./components/ScrollToTop";
import AgeGate from "./components/feature/AgeGate";

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <CartProvider>
        <BrowserRouter basename={__BASE_PATH__}>
          <ScrollToTop />
          {/* AgeGate renders above everything — blocks the entire site until confirmed */}
          <AgeGate />
          <AppRoutes />
          <CartDrawer />
          <FloatingCtaBar />
        </BrowserRouter>
      </CartProvider>
    </I18nextProvider>
  );
}

export default App;