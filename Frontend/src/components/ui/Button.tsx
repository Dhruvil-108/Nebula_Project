import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 shadow-lg',
  };

  const variantStyles = {
    primary: 'bg-[#f0512f] hover:bg-[#d63f1e] text-white shadow-md shadow-[#f0512f]/25 border border-[#f0512f]/60 hover:shadow-[#f0512f]/35 focus:ring-[#f0512f] active:scale-[0.98]',
    brand: 'bg-[#f0512f] hover:bg-[#d63f1e] text-white shadow-md shadow-[#f0512f]/25 border border-[#f0512f]/60 hover:shadow-[#f0512f]/35 focus:ring-[#f0512f] active:scale-[0.98]',
    secondary: 'bg-[#fbf0e7] hover:bg-[#f6e8dc] text-[#7a2f05] border border-[#de7a3d] hover:border-[#c2540c] shadow-sm focus:ring-[#c2540c] active:scale-[0.98]',
    outline: 'bg-transparent hover:bg-[#fbf0e7] text-[#7a2f05] border border-[#de7a3d] hover:border-[#c2540c] focus:ring-[#c2540c]',
    ghost: 'bg-transparent hover:bg-[#fbf0e7] text-[#6b6b6b] hover:text-[#1a1a1a] focus:ring-[#c2540c]',
    danger: 'bg-[#c2540c] hover:bg-[#a6470a] text-white border border-[#c2540c] shadow-[#c2540c]/20 focus:ring-[#c2540c]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-1" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
