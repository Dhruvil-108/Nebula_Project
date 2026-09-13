import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  ShieldCheck,
  TrendingUp,
  Users,
  Package,
  Receipt,
  Sparkles,
  Zap
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { NebulaLogo } from '../ui/NebulaLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  currentStep?: number;
  totalSteps?: number;
  quote?: {
    text: string;
    author: string;
    role: string;
    org: string;
  };
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps,
  quote = {
    text: "Consolidating our CRM, HRMS, and Expenses into Nebula cut our weekly admin hours by 40% and gave us real-time operational clarity.",
    author: "Elena Rostova",
    role: "Chief Operating Officer",
    org: "Apex Global Dynamics"
  }
}) => {
  return (
    <div className="public-theme min-h-screen w-full bg-slate-950 flex flex-col justify-between relative overflow-hidden">

      {/* Background ambient lighting */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-radial-gradient opacity-80 pointer-events-none" />
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />

      {/* Main Split Container */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10">

        {/* Left Side: Form / Wizard Canvas */}
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-14 max-w-2xl mx-auto lg:max-w-none"
        >

          {/* Top Brand Link & Progress Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex items-center justify-between mb-8 sm:mb-10"
            >
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <NebulaLogo />
              </Link>

              {currentStep && totalSteps && (
                <Badge variant="brand" size="sm">
                  Wizard Step {currentStep} of {totalSteps}
                </Badge>
              )}
            </motion.div>

            {/* Header Content */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="mb-6 text-left"
            >
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                {title}
              </h1>
              <p className="text-sm text-slate-400">
                {subtitle}
              </p>
            </motion.div>

            {/* Form / Wizard Slot */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              className="w-full max-w-md"
            >
              {children}
            </motion.div>
          </div>

          {/* Micro Footer */}
          <div className="pt-8 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 mt-10 max-w-md">
            <span>© {new Date().getFullYear()} Nebula Hub</span>
            <div className="flex items-center gap-3">
              <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
              <span>·</span>
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
              <span>·</span>
              <a href="#" className="hover:text-slate-300 transition-colors">Security Architecture</a>
            </div>
          </div>

        </motion.div>

        {/* Right Side: Enterprise Branded Visual Panel (Hidden on mobile) */}
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border-l border-slate-800/80 p-12 lg:p-14 flex-col justify-between relative overflow-hidden"
        >

          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#f0512f]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

          {/* Top Status Badge */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-300">Multi-Tenant Tenant Isolation Active</span>
            </div>
            <Badge variant="brand" size="sm">
              {currentStep ? `Step ${currentStep}: Provisioning` : 'Enterprise Hub'}
            </Badge>
          </div>

          {/* Centerpiece Visual: Module Connectivity Architecture */}
          <div className="my-auto py-6 relative z-10">
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/90 backdrop-blur-xl shadow-2xl space-y-4">

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#f0512f]/20 text-[#ff7a59]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Your Organization Workspace</div>
                    <div className="text-[10px] text-slate-400">Automatic tenant partitioning & encryption</div>
                  </div>
                </div>
                <Badge variant="emerald" size="sm" dot>Provisioned</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <TrendingUp className="w-3.5 h-3.5 text-[#ff7a59]" />
                    CRM Pipeline
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px]">Active</span>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    HRMS & People
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px]">Active</span>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-[#f0512f]" />
                    Recruitment ATS
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px]">Active</span>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    Expense Flow
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px]">Active</span>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    Inventory & POs
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px]">Active</span>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff8c70]" />
                    Unified AI Engine
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px]">Active</span>
                </div>
              </div>

            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-slate-800/80">
            <p className="text-sm text-slate-300 italic mb-3 leading-relaxed">
              "{quote.text}"
            </p>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">{quote.author}</div>
                <div className="text-[11px] text-slate-400">{quote.role} · {quote.org}</div>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>SOC2 Compliant</span>
              </div>
            </div>
          </div>

        </motion.div>

      </div>

    </div>
  );
};
