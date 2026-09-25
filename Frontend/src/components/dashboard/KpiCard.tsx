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
    className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 animate-pulse shadow-sm"
  >
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl bg-slate-100" />
      <div className="w-16 h-5 rounded-full bg-slate-100" />
    </div>
    <div className="space-y-2">
      <div className="w-24 h-3 rounded bg-slate-100" />
      <div className="w-32 h-7 rounded bg-slate-100" />
    </div>
    <div className="w-full h-12 rounded-lg bg-slate-50" />
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
      className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#fed7aa] hover:shadow-md transition-all duration-300 cursor-default shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-3.5">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa] flex items-center justify-center flex-shrink-0 shadow-2xs">
            {getIcon(data.iconName)}
          </div>

          {/* Trend badge */}
          {data.trendPercent !== null ? (
            <span
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs',
                isPositive
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : isNegative
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : 'text-slate-600 bg-slate-100 border-slate-200'
              )}
            >
              {isPositive && <TrendingUp className="w-3 h-3 text-emerald-600" />}
              {isNegative && <TrendingDown className="w-3 h-3 text-rose-600" />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3 text-slate-500" />}
              {isNegative ? '' : '+'}
              {data.trendPercent.toFixed(1)}%
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200">
              {data.trendLabel}
            </span>
          )}
        </div>

        {/* Title + Value */}
        <div className="mb-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{data.title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{data.value}</p>
          {data.trendPercent !== null && (
            <p className="text-[11px] text-slate-500 mt-1">{data.trendLabel}</p>
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
                  <stop
                    offset="5%"
                    stopColor={isNegative ? '#ef4444' : '#f97316'}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={isNegative ? '#ef4444' : '#f97316'}
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
                stroke={isNegative ? '#ef4444' : '#f97316'}
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
