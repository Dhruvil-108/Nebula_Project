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

// ── Dynamic icon resolver ──
import * as LucideIcons from 'lucide-react';

import type { KpiCardData } from '../../types/dashboard';

interface KpiCardProps {
  data: KpiCardData;
  index: number; // for stagger delay
  isLoading?: boolean;
}

const getIcon = (name: string): React.ReactNode => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<{ className?: string }>;
  return Icon ? <Icon className="w-5 h-5" /> : null;
};

// ── Skeleton loader ──
export const KpiCardSkeleton: React.FC<{ index: number }> = ({ index }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.05 }}
    className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/60 space-y-4 animate-pulse"
  >
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl bg-slate-800" />
      <div className="w-16 h-5 rounded-full bg-slate-800" />
    </div>
    <div className="space-y-2">
      <div className="w-24 h-3 rounded bg-slate-800" />
      <div className="w-32 h-7 rounded bg-slate-800" />
    </div>
    <div className="w-full h-12 rounded-lg bg-slate-800/60" />
  </motion.div>
);

// ── KPI Card ──
export const KpiCard: React.FC<KpiCardProps> = ({ data, index }) => {
  const hasSparkline = data.sparkline && data.sparkline.length > 1;

  const sparkData = hasSparkline
    ? data.sparkline!.map((v, i) => ({ v, i }))
    : [];

  const isPositive = data.trendPercent !== null && data.trendPercent > 0;
  const isNegative = data.trendPercent !== null && data.trendPercent < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.07,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60 hover:border-[#f0512f]/40 hover:bg-slate-900/80 transition-all duration-300 hover:shadow-card-border cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-[#fbeae0] text-[#7a2f05] flex items-center justify-center flex-shrink-0">
          {getIcon(data.iconName)}
        </div>

        {/* Trend badge */}
        {data.trendPercent !== null ? (
          <span
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
              isPositive
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : isNegative
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  : 'text-slate-400 bg-slate-800 border-slate-700'
            )}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
            {isNegative ? '' : '+'}
            {data.trendPercent.toFixed(1)}%
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-500 bg-slate-800/60 border border-slate-700/40">
            {data.trendLabel}
          </span>
        )}
      </div>

      {/* Title + Value */}
      <div className="mb-3">
        <p className="text-xs font-medium text-slate-500 mb-1">{data.title}</p>
        <p className="text-2xl font-bold text-slate-50 tracking-tight">{data.value}</p>
        {data.trendPercent !== null && (
          <p className="text-[11px] text-slate-500 mt-0.5">{data.trendLabel}</p>
        )}
      </div>

      {/* Sparkline */}
      {hasSparkline && (
        <div className="h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${data.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isNegative ? '#ef4444' : '#f0512f'}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isNegative ? '#ef4444' : '#f0512f'}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Tooltip
                content={() => null}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={isNegative ? '#ef4444' : '#f0512f'}
                strokeWidth={1.5}
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
