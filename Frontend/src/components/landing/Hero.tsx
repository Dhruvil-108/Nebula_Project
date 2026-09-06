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
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Decorative Gradients & Mesh (Zorvi warm sunset ambiance) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-radial-gradient pointer-events-none opacity-90" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-[#f0512f]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Eyebrow Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f0512f]/10 border border-[#f0512f]/30 text-[#ff8c70] text-xs font-semibold mb-6 shadow-sm shadow-[#f0512f]/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#f0512f]" />
          <span>One Platform. Every Business Operation.</span>
          <span className="w-1 h-1 rounded-full bg-[#f0512f]" />
          <span className="text-slate-400 font-normal">v2.4 Enterprise Release</span>
        </motion.div>

        {/* Strong H1 Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.08] mb-6"
        >
          Stop juggling six tools. <br className="hidden sm:inline" />
          <span className="text-gradient-accent">Operate your entire company</span> from one unified hub.
        </motion.h1>

        {/* Subhead with real product context */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8"
        >
          Nebula unites <strong className="text-white font-medium">CRM</strong>, <strong className="text-white font-medium">HRMS</strong>, <strong className="text-white font-medium">Recruitment (ATS)</strong>, <strong className="text-white font-medium">Expense Approvals</strong>, <strong className="text-white font-medium">Inventory</strong>, and <strong className="text-white font-medium">Unified AI Analytics</strong> into a single data model. One login, total cross-department visibility.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/signup')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto text-base px-8 py-3.5 shadow-xl shadow-[#f0512f]/25"
          >
            Start 14-Day Free Trial
          </Button>

          <a href="#modules" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="secondary"
              leftIcon={<Play className="w-4 h-4 text-[#ff7a59] fill-[#f0512f]/20" />}
              className="w-full sm:w-auto text-base px-7 py-3.5 hover:border-[#f0512f]/30"
            >
              Explore 6 Core Modules
            </Button>
          </a>
        </motion.div>

        {/* Trust Badges under CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 mb-14"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Instant multi-tenant workspace
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
