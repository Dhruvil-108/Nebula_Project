import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'indigo' | 'brand' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    indigo: 'bg-orange-50 text-[#ea580c] border border-orange-200',
    brand: 'bg-orange-50 text-[#ea580c] border border-orange-200',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cyan: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200',
    outline: 'bg-white text-slate-700 border border-slate-200 shadow-sm',
  };

  const dotColors = {
    default: 'bg-slate-400',
    indigo: 'bg-[#f0512f] animate-pulse',
    brand: 'bg-[#f0512f] animate-pulse',
    emerald: 'bg-emerald-500 animate-pulse',
    cyan: 'bg-cyan-500 animate-pulse',
    amber: 'bg-amber-500 animate-pulse',
    rose: 'bg-rose-500 animate-pulse',
    outline: 'bg-[#f0512f]',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
