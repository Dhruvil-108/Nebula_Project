import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  dotColor?: string;
  disabled?: boolean;
}

export interface FloatingDropdownProps<T = string> {
  options: DropdownOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
  searchPlaceholder?: string;
  align?: 'left' | 'right';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  id?: string;
}

export function FloatingDropdown<T = string>({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  size = 'md',
  searchable = false,
  searchPlaceholder = 'Search...',
  align = 'left',
  fullWidth = true,
  leftIcon,
  clearable = false,
  onClear,
  id,
}: FloatingDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const dropdownId = id || generatedId;

  // Selected Option
  const selectedOption = options.find((opt) => opt.value === value);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable]);

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredOptions = searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  const sizeClasses = {
    sm: 'text-xs py-1.5 px-2.5 gap-1.5 min-h-[32px]',
    md: 'text-xs py-2 px-3 gap-2 min-h-[38px]',
    lg: 'text-sm py-2.5 px-3.5 gap-2.5 min-h-[42px]',
  };

  return (
    <div
      ref={containerRef}
      className={clsx('relative inline-block text-left select-none', fullWidth ? 'w-full' : '', className)}
    >
      {label && (
        <label
          htmlFor={dropdownId}
          className="block text-xs font-semibold text-[#1A1A1A] mb-1 truncate"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={dropdownId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={clsx(
          'w-full flex items-center justify-between rounded-xl border bg-white text-left font-medium transition-all shadow-2xs',
          sizeClasses[size],
          isOpen
            ? 'border-[#f97316] ring-2 ring-[#f97316]/20 bg-[#fff7ed]/20 text-[#111827]'
            : 'border-[#ECE0D6] hover:border-[#d1d5db] hover:bg-[#fafbfc] text-[#111827]',
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer',
          error ? 'border-red-400 ring-2 ring-red-400/20' : '',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {leftIcon && <span className="flex-shrink-0 text-slate-400">{leftIcon}</span>}
          {selectedOption?.dotColor && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedOption.dotColor }}
            />
          )}
          {selectedOption?.icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          {selectedOption ? (
            <span className="truncate font-semibold text-[#111827]">{selectedOption.label}</span>
          ) : (
            <span className="text-[#9B9B9B] truncate">{placeholder}</span>
          )}
          {selectedOption?.badge && <span className="flex-shrink-0">{selectedOption.badge}</span>}
        </div>

        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {clearable && selectedOption && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear?.();
              }}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={clsx(
              'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
              isOpen && 'rotate-180 text-[#f97316]'
            )}
          />
        </div>
      </button>

      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}

      {/* Floating Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={clsx(
              'absolute z-50 mt-1.5 rounded-2xl bg-white border border-[#ECE0D6] shadow-xl overflow-hidden min-w-[200px]',
              align === 'right' ? 'right-0' : 'left-0',
              fullWidth ? 'w-full' : 'w-max max-w-sm',
              menuClassName
            )}
            style={{
              boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            }}
          >
            {/* Search input if searchable */}
            {searchable && (
              <div className="p-2 border-b border-[#ECE0D6] bg-[#FBF8F4]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#ECE0D6] bg-white text-[#111827] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-1 focus:ring-[#f97316]"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="py-4 px-3 text-center text-xs text-[#9B9B9B]">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors',
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#fff7ed] text-[#ea580c] font-semibold'
                          : 'text-[#374151] hover:bg-[#FAF7F2] hover:text-[#111827]'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                        {opt.dotColor && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: opt.dotColor }}
                          />
                        )}
                        {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                        <div className="truncate min-w-0">
                          <span className="block truncate">{opt.label}</span>
                          {opt.sublabel && (
                            <span className="block text-[10px] text-[#9ca3af] truncate">
                              {opt.sublabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {opt.badge && <span>{opt.badge}</span>}
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#f97316]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
