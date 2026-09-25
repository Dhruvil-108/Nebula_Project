import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Zap,
  CheckCircle2,
  Play
} from 'lucide-react';
import { Button } from '../ui/Button';
import { CompositeHeroDashboard } from '../mockups/CompositeHeroDashboard';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-white">
      {/* Background Animated Floating Gradients (attractive warm ambient glow) */}
      <motion.div
        animate={{
          x: [0, 25, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.12, 0.95, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-tr from-[#f0512f]/15 via-amber-400/10 to-orange-200/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 25, -15, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute top-40 left-1/6 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, 20, -25, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.15, 0.98, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
        className="absolute top-60 right-1/6 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />

      {/* Main Full-Width Content Container */}
      <div className="relative w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 text-center z-10">

        {/* Eyebrow Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.04 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/90 text-[#ea580c] text-xs font-semibold mb-6 shadow-xs cursor-default"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#f0512f] animate-spin-slow" />
          <span>One Platform. Every Business Operation.</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#f0512f] animate-pulse" />
          <span className="text-slate-600 font-normal">v2.4 Enterprise Release</span>
        </motion.div>

        {/* Strong H1 Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl xl:text-[5.2rem] font-extrabold tracking-tight text-slate-950 max-w-6xl mx-auto leading-[1.08] mb-6"
        >
          Stop juggling six tools. <br className="hidden sm:inline" />
          <span className="text-gradient-accent">Operate your entire company</span> from one unified hub.
        </motion.h1>

        {/* Subhead with real product context */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-8"
        >
          Nebula unites <strong className="text-slate-900 font-semibold">CRM</strong>, <strong className="text-slate-900 font-semibold">HRMS</strong>, <strong className="text-slate-900 font-semibold">Recruitment (ATS)</strong>, <strong className="text-slate-900 font-semibold">Expense Approvals</strong>, <strong className="text-slate-900 font-semibold">Inventory</strong>, and <strong className="text-slate-900 font-semibold">Unified AI Analytics</strong> into a single data model. One login, total cross-department visibility.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/signup')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto text-base px-8 py-3.5 shadow-xl shadow-[#f0512f]/25 font-semibold"
            >
              Start 14-Day Free Trial
            </Button>
          </motion.div>

          <motion.a href="#modules" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="secondary"
              leftIcon={<Play className="w-4 h-4 text-[#f0512f] fill-[#f0512f]/20" />}
              className="w-full sm:w-auto text-base px-7 py-3.5 bg-white border-slate-200 hover:border-orange-300 text-slate-800 font-semibold shadow-xs"
            >
              Explore 6 Core Modules
            </Button>
          </motion.a>
        </motion.div>

        {/* Trust Badges under CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-600 mb-14 font-medium"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Instant multi-tenant workspace
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            SOC2-ready RBAC security
          </span>
        </motion.div>

        {/* Composite Hero Product Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="pt-2"
        >
          <CompositeHeroDashboard />
        </motion.div>

      </div>
    </section>
  );
};
