import React from 'react';
interface NebulaLogoProps {
    showWordmark?: boolean;
    compact?: boolean;
    inverted?: boolean;
    className?: string;
}

export const NebulaLogo: React.FC<NebulaLogoProps> = ({
    showWordmark = true,
    compact = false,
    inverted = false,
    className = '',
}) => (
    <span className={`inline-flex items-center ${className}`}>
        <span className={compact ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1 shadow-sm overflow-hidden' : 'inline-flex h-12 w-auto items-center rounded-xl bg-white overflow-hidden'}>
            <img
                src={compact ? '/images/NebulaHub_Favicon_Clear_128x128.png' : '/images/NebulaHub_Logo_WhiteBG_UltraHD.png'}
                alt="Nebula Hub"
                className={compact ? 'h-full w-full rounded-md object-contain' : 'h-full w-auto max-w-[220px] object-contain'}
            />
        </span>
    </span>
);
