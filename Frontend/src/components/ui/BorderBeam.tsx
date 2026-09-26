import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface BorderBeamProps {
  duration?: number;
  size?: number; // length of the beam (0-100)
  color?: string;
  glowColor?: string;
  strokeWidth?: number;
  rx?: number | string;
  className?: string;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  duration = 7,
  size = 25,
  color = '#f0512f',
  glowColor = 'rgba(240, 81, 47, 0.85)',
  strokeWidth = 2.5,
  rx = 24,
  className = '',
}) => {
  const rawId = useId();
  const gradientId = `beam-gradient-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-20 ${className}`}
      style={{ padding: '0.5px', borderRadius: typeof rx === 'number' ? `${rx}px` : rx }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Full-opacity vivid beam gradient so it never dims or fades out in any corner */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="50%" stopColor="#ff7a59" stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <motion.rect
        x="1"
        y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        rx={rx}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${size} ${100 - size}`}
        style={{
          filter: `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 12px rgba(240, 81, 47, 0.5))`,
        }}
        animate={{ strokeDashoffset: [0, -100] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
};

