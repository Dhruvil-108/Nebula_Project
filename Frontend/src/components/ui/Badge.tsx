import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'indigo' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'outline';
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
    default: 'bg-slate-800 text-slate-300 border border-slate-700/60',
    indigo: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border border-rose-500/30',
    outline: 'bg-white/[0.03] text-slate-300 border border-white/10 backdrop-blur-sm',
  };

  const dotColors = {
    default: 'bg-slate-400',
    indigo: 'bg-indigo-400 animate-pulse',
    emerald: 'bg-emerald-400 animate-pulse',
    cyan: 'bg-cyan-400 animate-pulse',
    amber: 'bg-amber-400 animate-pulse',
    rose: 'bg-rose-400 animate-pulse',
    outline: 'bg-indigo-400',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
