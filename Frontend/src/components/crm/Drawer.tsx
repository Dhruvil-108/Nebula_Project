import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg';
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'lg',
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white border-l border-[#ECE0D6] shadow-2xl w-full ${
              width === 'lg' ? 'sm:max-w-xl' : 'sm:max-w-md'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-start justify-between gap-3 px-6 py-4 border-b border-[#ECE0D6]">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#1A1A1A] truncate">{title}</h3>
                {subtitle && <p className="text-xs text-[#6B6B6B] mt-0.5 truncate">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBEAE0] transition-colors"
                aria-label="Close panel"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex-shrink-0 px-6 py-4 border-t border-[#ECE0D6] bg-white">{footer}</div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
