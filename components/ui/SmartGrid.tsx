import React from 'react';
import { AlignJustify, Rows3 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface DensityToggleProps {
  className?: string;
}

export const DensityToggle: React.FC<DensityToggleProps> = ({ className = '' }) => {
  const { density, setDensity } = useTheme();

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 shrink-0 ${className}`}
      role="group"
      aria-label="Grid density"
    >
      <button
        type="button"
        onClick={() => setDensity('comfortable')}
        title="Comfortable row spacing"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
          density === 'comfortable'
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Rows3 size={13} />
        <span className="hidden sm:inline">Comfortable</span>
      </button>
      <button
        type="button"
        onClick={() => setDensity('compact')}
        title="Compact high-density rows"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
          density === 'compact'
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <AlignJustify size={13} />
        <span className="hidden sm:inline">Compact</span>
      </button>
    </div>
  );
};

interface SmartGridToolbarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  showDensityToggle?: boolean;
  className?: string;
}

export const SmartGridToolbar: React.FC<SmartGridToolbarProps> = ({
  left,
  right,
  showDensityToggle = true,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">{left}</div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {showDensityToggle && <DensityToggle />}
        {right}
      </div>
    </div>
  );
};

interface SmartTableContainerProps {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  maxHeightClass?: string;
  className?: string;
}

export const SmartTableContainer: React.FC<SmartTableContainerProps> = ({
  children,
  toolbar,
  footer,
  maxHeightClass = 'max-h-[68vh]',
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden flex flex-col ${className}`}
    >
      {toolbar}
      <div className={`w-full overflow-x-auto overflow-y-auto ${maxHeightClass}`}>{children}</div>
      {footer}
    </div>
  );
};
