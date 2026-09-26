import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import * as LucideIcons from 'lucide-react';
import type { KpiCardData } from '../../types/dashboard';

interface KpiCardProps {
  data: KpiCardData;
  index: number;
  isLoading?: boolean;
}

const getIcon = (name: string): React.ReactNode => {
  const Icon = (LucideIcons as any)[name] as React.ComponentType<{ className?: string }>;
  return Icon ? <Icon className="w-5 h-5" /> : null;
};

/* ── Shimmer skeleton ── */
export const KpiCardSkeleton: React.FC<{ index: number }> = ({ index }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.05 }}
    className="p-5 rounded-2xl space-y-4"
    style={{
      background: 'var(--pl-card)',
      border: '1px solid var(--pl-border)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px -4px rgba(0,0,0,0.06)',
    }}
  >
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl pl-shimmer" />
      <div className="w-16 h-5 rounded-full pl-shimmer" />
    </div>
    <div className="space-y-2">
      <div className="w-24 h-3 rounded pl-shimmer" />
      <div className="w-32 h-7 rounded pl-shimmer" />
    </div>
    <div className="w-full h-12 rounded-lg pl-shimmer" />
  </motion.div>
);

/* ── KPI Card ── */
export const KpiCard: React.FC<KpiCardProps> = ({ data, index }) => {
  const hasSparkline = data.sparkline && data.sparkline.length > 1;
  const sparkData = hasSparkline ? data.sparkline!.map((v, i) => ({ v, i })) : [];
  const isPositive = data.trendPercent !== null && data.trendPercent > 0;
  const isNegative = data.trendPercent !== null && data.trendPercent < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group p-5 rounded-2xl flex flex-col justify-between cursor-default transition-all duration-300"
      style={{
        background: 'var(--pl-card)',
        border: '1px solid var(--pl-border)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px -4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--pl-brand-border)';
        el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04), 0 8px 20px -6px rgba(249,115,22,0.1), 0 0 0 1px rgba(249,115,22,0.06)';
        el.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--pl-border)';
        el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px -4px rgba(0,0,0,0.06)';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div>
        <div className="flex items-start justify-between mb-3.5">
          {/* Icon well */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              border: '1px solid var(--pl-brand-border)',
              color: 'var(--pl-brand-dark)',
              boxShadow: '0 1px 3px rgba(249,115,22,0.1)',
            }}
          >
            {getIcon(data.iconName)}
          </div>

          {/* Trend badge */}
          {data.trendPercent !== null ? (
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={
                isPositive
                  ? { background: 'var(--pl-success-bg)', border: '1px solid var(--pl-success-border)', color: 'var(--pl-success)' }
                  : isNegative
                  ? { background: 'var(--pl-danger-bg)', border: '1px solid var(--pl-danger-border)', color: 'var(--pl-danger)' }
                  : { background: 'var(--pl-canvas)', border: '1px solid var(--pl-border)', color: 'var(--pl-text-muted)' }
              }
            >
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
              {isNegative ? '' : '+'}{data.trendPercent.toFixed(1)}%
            </span>
          ) : (
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{ background: 'var(--pl-canvas)', border: '1px solid var(--pl-border)', color: 'var(--pl-text-muted)' }}
            >
              {data.trendLabel}
            </span>
          )}
        </div>

        {/* Title + Value */}
        <div className="mb-2">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1 font-mono"
            style={{ color: 'var(--pl-text-faint)' }}
          >
            {data.title}
          </p>
          <p
            className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono"
            style={{ color: 'var(--pl-text-primary)' }}
          >
            {data.value}
          </p>
          {data.trendPercent !== null && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--pl-text-muted)' }}>
              {data.trendLabel}
            </p>
          )}
        </div>
      </div>

      {/* Sparkline */}
      {hasSparkline && (
        <div className="h-10 -mx-1 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${data.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={isNegative ? '#dc2626' : '#f97316'} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={isNegative ? '#dc2626' : '#f97316'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={() => null} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={isNegative ? '#dc2626' : '#f97316'}
                strokeWidth={2}
                fill={`url(#grad-${data.id})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};
