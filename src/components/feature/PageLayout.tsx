import { ReactNode } from 'react';
import TickerBar from './TickerBar';
import UtilityBar from './UtilityBar';
import Navbar from './Navbar';
import Footer from './Footer';
import AgeGate from './AgeGate';

interface PageLayoutProps {
  children: ReactNode;
  showAgeGate?: boolean;
}

export default function PageLayout({ children, showAgeGate = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-parchment">
      {showAgeGate && <AgeGate />}
      <TickerBar />
      <UtilityBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}