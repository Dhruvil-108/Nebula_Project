import React from 'react';

/** Small label/value tile used inside CRM detail drawers */
export const InfoTile: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="rounded-xl border border-[#ECE0D6] p-3">
    <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">
      {icon}
      {label}
    </p>
    <p className="text-xs text-[#1A1A1A] break-words">{value}</p>
  </div>
);
