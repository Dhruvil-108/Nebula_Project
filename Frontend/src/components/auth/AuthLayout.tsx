import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NebulaLogo } from '../ui/NebulaLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Card title shown above the form */
  heading: string;
  /** Subtext below the heading */
  subheading?: string;
  /** Width class for the card - defaults to max-w-md */
  maxWidth?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  heading,
  subheading,
  maxWidth = 'max-w-md',
}) => {
  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center overflow-hidden bg-[#fdfaf7] selection:bg-[#f0512f]/20 selection:text-[#c2410c]">

      {/* ── Ambient warm gradient mesh ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left warm amber glow */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-radial from-amber-200/60 via-orange-100/30 to-transparent rounded-full blur-3xl" />
        {/* Top-right soft peach glow */}
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-gradient-radial from-orange-200/40 via-amber-100/20 to-transparent rounded-full blur-3xl" />
        {/* Bottom-center warm red-orange */}
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-radial from-[#f0512f]/12 via-amber-200/15 to-transparent rounded-full blur-3xl" />
        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(120,53,15,0.12) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      {/* ── Floating ambient orbs (animated) ── */}
      <motion.div
        animate={{ x: [0, 18, -12, 0], y: [0, -22, 14, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/6 w-72 h-72 bg-amber-300/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -15, 20, 0], y: [0, 18, -10, 0], scale: [1, 0.92, 1.06, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute bottom-1/3 right-1/6 w-80 h-80 bg-orange-200/25 rounded-full blur-3xl pointer-events-none"
      />

      {/* ── Centered content wrapper ── */}
      <div className={`relative z-10 w-full ${maxWidth} mx-auto px-4 py-10`}>

        {/* Logo — above card */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex justify-center mb-7"
        >
          <Link to="/" className="inline-flex">
            <NebulaLogo />
          </Link>
        </motion.div>

        {/* ── Main floating card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_8px_40px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden"
        >
          {/* Card header with title */}
          {(heading || subheading) && (
            <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100">
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4 }}
                className="text-[1.6rem] font-bold text-slate-950 tracking-tight mb-1.5"
              >
                {heading}
              </motion.h1>
              {subheading && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.4 }}
                  className="text-sm text-slate-500 leading-relaxed"
                >
                  {subheading}
                </motion.p>
              )}
            </div>
          )}

          {/* Card body — form slot */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="px-8 py-7"
          >
            {children}
          </motion.div>
        </motion.div>

        {/* Below-card footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex items-center justify-center gap-4 mt-6 text-[11px] text-slate-400"
        >
          <Link to="/" className="hover:text-slate-600 transition-colors">Home</Link>
          <span>·</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Security</a>
          <span>·</span>
          <span>© {new Date().getFullYear()} Nebula Hub</span>
        </motion.div>
      </div>
    </div>
  );
};
