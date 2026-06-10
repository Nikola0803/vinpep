import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TickerBar from '@/components/feature/TickerBar';
import UtilityBar from '@/components/feature/UtilityBar';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import AgeGate from '@/components/feature/AgeGate';
import HeroSection from './components/HeroSection';
import ProductGrid from './components/ProductGrid';
import CategoryTiles from './components/CategoryTiles';
import EditorialStrip from './components/EditorialStrip';
import Newsletter from './components/Newsletter';
import ResearchUseWarning from './components/ResearchUseWarning';

export default function Home() {
  return (
    <div className="min-h-screen bg-parchment">
      <AgeGate />
      <TickerBar />
      <UtilityBar />
      <Navbar />
      <main>
        {/* 1. Hero — immediate hook */}
        <HeroSection />

        {/* 2. Research Use Only warning — sits on dark bg, fades into parchment below */}
        <ResearchUseWarning />

        {/* 3. The Catalogue — products */}
        <ProductGrid />

        {/* 4. Browse by Category */}
        <CategoryTiles />

        {/* 5. Purity editorial — trust */}
        <EditorialStrip />

        {/* 6. Newsletter — email capture */}
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}