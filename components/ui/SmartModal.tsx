import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type SmartModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const SIZE_CLASSES: Record<SmartModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-6xl',
};

interface SmartModalProps {
  open?: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  size?: SmartModalSize;
  footer?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  zIndexClass?: string;
  bodyClassName?: string;
  closeOnBackdrop?: boolean;
}

/**
 * Centered viewport-fit modal shell with sticky header, aligned scrollable body,
 * and sticky footer so action buttons and context remain accessible at all times.
 */
export const SmartModal: React.FC<SmartModalProps> = ({
  open = true,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',
  footer,
  headerExtra,
  children,
  zIndexClass = 'z-50',
  bodyClassName = '',
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/55 backdrop-blur-sm pb-safe`}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`smart-modal-enter flex flex-col w-full ${SIZE_CLASSES[size]} max-h-[92dvh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden`}
      >
        {/* Sticky Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="shrink-0 w-9 h-9 rounded-xl theme-accent-soft flex items-center justify-center">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerExtra}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Aligned Body */}
        <div className={`flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 ${bodyClassName}`}>
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="shrink-0 flex flex-wrap items-center justify-end gap-2.5 px-4 sm:px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface SmartFormGridProps {
  cols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export const SmartFormGrid: React.FC<SmartFormGridProps> = ({ cols = 2, children, className = '' }) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols];

  return <div className={`grid ${colClasses} gap-3.5 items-start ${className}`}>{children}</div>;
};

interface SmartFormFieldProps {
  label: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  span?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export const SmartFormField: React.FC<SmartFormFieldProps> = ({
  label,
  required,
  hint,
  span = 1,
  children,
  className = '',
}) => {
  const spanClass =
    span === 2
      ? 'sm:col-span-2'
      : span === 3
      ? 'sm:col-span-2 lg:col-span-3'
      : span === 4
      ? 'sm:col-span-2 lg:col-span-4'
      : '';

  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${spanClass} ${className}`}>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
        <span className="truncate">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </span>
        {hint && <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 shrink-0">{hint}</span>}
      </label>
      {children}
    </div>
  );
};

export const SMART_INPUT_CLASS =
  'w-full h-10 px-3 py-2 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-colors';

export const SMART_TEXTAREA_CLASS =
  'w-full px-3 py-2 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-colors resize-y';
