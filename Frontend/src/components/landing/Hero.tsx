import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Play,
  TrendingUp,
  Users,
  Layers,
} from 'lucide-react';
import { CompositeHeroDashboard } from '../mockups/CompositeHeroDashboard';

const STAT_PILLS = [
  { icon: TrendingUp, label: 'CRM Pipeline', value: '$2.4M', color: 'text-[#f0512f]', bg: 'bg-orange-50', border: 'border-orange-100' },
  { icon: Users, label: 'Team Members', value: '284 Active', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  { icon: Layers, label: 'Modules Active', value: '6 / 6', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
];

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen pt-28 pb-16 overflow-hidden bg-white">

      {/* ── Background: subtle warm grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -5%, rgba(240,81,47,0.06) 0%, transparent 65%),
            linear-gradient(rgba(30,20,10,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,20,10,0.035) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, 40px 40px, 40px 40px',
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex justify-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0512f] animate-pulse" />
            v2.4 Enterprise Release · All 6 Modules Active
          </span>
        </motion.div>

        {/* H1 Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-950 leading-[1.1] max-w-4xl mx-auto">
            Stop juggling six tools.{' '}
            <br className="hidden sm:block" />
            <span className="relative inline-block">
              <span className="text-[#f0512f]">Run your entire company</span>
              {/* Animated underline */}
              <motion.svg
                viewBox="0 0 400 12"
                className="absolute -bottom-1 left-0 w-full overflow-visible"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.path
                  d="M 4 8 C 80 3, 200 12, 396 7"
                  stroke="#f0512f"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.35"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.75, duration: 0.9, ease: 'easeOut' }}
                />
              </motion.svg>
            </span>{' '}
            from one hub.
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="text-center text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Nebula unites{' '}
          <strong className="text-slate-700 font-semibold">CRM</strong>,{' '}
          <strong className="text-slate-700 font-semibold">HRMS</strong>,{' '}
          <strong className="text-slate-700 font-semibold">ATS</strong>,{' '}
          <strong className="text-slate-700 font-semibold">Expenses</strong>,{' '}
          <strong className="text-slate-700 font-semibold">Inventory</strong>, and{' '}
          <strong className="text-slate-700 font-semibold">AI Analytics</strong>{' '}
          into one data model. One login, total visibility.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/signup')}
            className="flex items-center gap-2.5 px-7 py-3.5 bg-[#f0512f] hover:bg-[#d94425] text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-[#f0512f]/25"
          >
            Start 14-Day Free Trial
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          <motion.a
            href="#modules"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2.5 px-7 py-3.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm rounded-xl transition-all hover:bg-slate-50 shadow-sm"
          >
            <Play className="w-4 h-4 text-[#f0512f] fill-[#f0512f]/15" />
            Explore 6 Core Modules
          </motion.a>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500 mb-14"
        >
          {[
            'No credit card required',
            'Instant multi-tenant workspace',
            'SOC2-ready RBAC security',
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {item}
            </span>
          ))}
        </motion.div>

        {/* Live stat pills floating above the dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mb-6"
        >
          {STAT_PILLS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.08 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-full ${stat.bg} border ${stat.border} shadow-sm cursor-default`}
              >
                <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-xs font-medium text-slate-600">{stat.label}</span>
                <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Hero Product Visual ── */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Glow beneath dashboard */}
          <div className="absolute inset-x-10 bottom-0 h-32 bg-gradient-to-t from-[#f0512f]/8 via-amber-400/5 to-transparent rounded-b-3xl blur-2xl pointer-events-none" />
          <CompositeHeroDashboard />
        </motion.div>

      </div>
    </section>
  );
};
