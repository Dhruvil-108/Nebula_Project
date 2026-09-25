import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="landing-page min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-[#f0512f] selection:text-white">
      {/* Sticky frosted Navbar */}
      <Navbar />

      {/* Main Page Sections */}
      <main className="flex-1">
        {[
          <Hero key="hero" />,
          <TrustStrip key="trust" />,
          <ProblemSolution key="problem" />,
          <ModuleShowcase key="modules" />,
          <RoleValueSection key="roles" />,
          <AnalyticsHighlight key="analytics" />,
          <SecuritySection key="security" />,
          <CTASection key="cta" />,
        ].map((section, index) => (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: index === 0 ? 0 : 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.55, delay: index === 0 ? 0 : 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            {section}
          </motion.div>
        ))}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
