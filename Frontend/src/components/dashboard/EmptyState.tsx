import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import type { EmptyStateConfig } from '../../types/dashboard';
import type { Role } from '../../types/user';
import type { FocusArea } from '../../types/organization';

// ─────────────────────────────────────────────────────────
// Role + focus based empty state content
// ─────────────────────────────────────────────────────────

const getEmptyStateConfig = (role: Role, primaryFocus: FocusArea[]): EmptyStateConfig => {
  const hasFocus = (f: FocusArea) =>
    primaryFocus.includes(f) || primaryFocus.includes('all');

  if (role === 'super_admin' || role === 'admin') {
    if (hasFocus('crm')) {
      return {
        heading: 'Your workspace is ready — add your first lead',
        subtext:
          'Import your contacts or add your first sales lead to start filling your CRM pipeline.',
        ctaLabel: 'Add First Lead →',
        ctaHref: '/dashboard/crm',
        iconName: 'Users',
      };
    }
    return {
      heading: 'Invite your team to unlock the full hub',
      subtext:
        'Your organization is live. Invite department managers and team members to start collaborating.',
      ctaLabel: 'Invite Teammates →',
      ctaHref: '/dashboard/settings',
      iconName: 'UserPlus',
    };
  }

  if (role === 'sales' || role === 'manager') {
    return {
      heading: 'No leads in your pipeline yet',
      subtext: 'Start by adding your first prospective client or importing existing contacts.',
      ctaLabel: 'Add First Lead →',
      ctaHref: '/dashboard/crm',
      iconName: 'Zap',
    };
  }

  if (role === 'hr') {
    return {
      heading: 'Your HRMS is ready — onboard your first employee',
      subtext: 'Add employee profiles, configure departments, and start tracking attendance.',
      ctaLabel: 'Add Employee →',
      ctaHref: '/dashboard/hrms',
      iconName: 'UserRound',
    };
  }

  if (role === 'recruiter') {
    return {
      heading: 'Post your first job opening',
      subtext:
        'Create job listings, track applicants, and manage your recruitment pipeline in one place.',
      ctaLabel: 'Post a Job →',
      ctaHref: '/dashboard/recruitment',
      iconName: 'Briefcase',
    };
  }

  if (role === 'finance') {
    return {
      heading: 'No expense reports yet',
      subtext: "Once team members submit expense claims, they'll appear here for your review.",
      ctaLabel: 'View Expenses →',
      ctaHref: '/dashboard/expenses',
      iconName: 'Receipt',
    };
  }

  if (role === 'inventory_manager') {
    return {
      heading: 'Add your first product to inventory',
      subtext: 'Set up your product catalog, define reorder thresholds, and start tracking stock.',
      ctaLabel: 'Add Product →',
      ctaHref: '/dashboard/inventory',
      iconName: 'Package',
    };
  }

  // Employee default
  return {
    heading: "You're all caught up",
    subtext:
      'No pending tasks or notifications right now. Check back after your manager assigns new work.',
    ctaLabel: 'View My Profile →',
    ctaHref: '/dashboard/profile',
    iconName: 'CheckCircle2',
  };
};

// ─────────────────────────────────────────────────────────
// EmptyState Component
// ─────────────────────────────────────────────────────────

interface EmptyStateProps {
  role: Role;
  primaryFocus: FocusArea[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({ role, primaryFocus }) => {
  const navigate = useNavigate();
  const config = getEmptyStateConfig(role, primaryFocus);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[config.iconName] as React.ComponentType<{ className?: string }>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center"
    >
      {/* Glow ring */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-[#f0512f]/20 blur-2xl scale-150" />
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[#f0512f]/20 to-[#ff7a59]/20 border border-[#f0512f]/30 flex items-center justify-center">
          {Icon && <Icon className="w-10 h-10 text-[#ff7a59]" />}
        </div>
      </div>

      {/* Dots decoration */}
      <div className="flex items-center gap-1.5 mb-6">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: i === 2 ? 1 : 0.4, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`rounded-full bg-[#f0512f] ${i === 2 ? 'w-2 h-2' : 'w-1.5 h-1.5'}`}
          />
        ))}
      </div>

      <h2 className="text-2xl font-bold text-white max-w-md mb-3">{config.heading}</h2>
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-8">{config.subtext}</p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(config.ctaHref)}
        className="px-6 py-3 rounded-xl bg-[#f0512f] hover:bg-[#d63f1e] text-white font-semibold text-sm transition-colors shadow-lg shadow-[#f0512f]/25 cursor-pointer"
      >
        {config.ctaLabel}
      </motion.button>

      {/* Decorative grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-dot-pattern" />
    </motion.div>
  );
};
