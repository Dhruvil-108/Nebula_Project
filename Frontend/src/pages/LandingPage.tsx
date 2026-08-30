import React from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { TrustStrip } from '../components/landing/TrustStrip';
import { ProblemSolution } from '../components/landing/ProblemSolution';
import { ModuleShowcase } from '../components/landing/ModuleShowcase';
import { RoleValueSection } from '../components/landing/RoleValueSection';
import { AnalyticsHighlight } from '../components/landing/AnalyticsHighlight';
import { SecuritySection } from '../components/landing/SecuritySection';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sticky frosted Navbar */}
      <Navbar />

      {/* Main Page Sections */}
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <ProblemSolution />
        <ModuleShowcase />
        <RoleValueSection />
        <AnalyticsHighlight />
        <SecuritySection />
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
