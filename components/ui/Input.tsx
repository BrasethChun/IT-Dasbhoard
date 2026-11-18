import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input: React.FC<InputProps> = ({ label, error, icon: Icon, className = '', ...props }) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </label>
      )}
      <div className="relative group transition-transform duration-200 ease-out focus-within:-translate-y-0.5">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors duration-200 group-focus-within:text-indigo-500 z-10 pointer-events-none">
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        <input
          className={`w-full rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/90 px-4 py-3 text-sm sm:text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs transition-all duration-200 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-xl ${
            Icon ? 'pl-11' : ''
          } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500 ml-1">{error}</p>}
    </div>
  );
};