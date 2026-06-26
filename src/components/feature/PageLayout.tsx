import { ReactNode } from 'react';
import TickerBar from './TickerBar';
import UtilityBar from './UtilityBar';
import Navbar from './Navbar';
import Footer from './Footer';

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-parchment">
      <TickerBar />
      <UtilityBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}