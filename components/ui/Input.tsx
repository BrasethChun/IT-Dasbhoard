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
        <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500/80">
          {label}
        </label>
      )}
      <div className="relative group transition-transform duration-300 ease-out focus-within:scale-[1.01] focus-within:-translate-y-0.5">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-indigo-500 z-10 pointer-events-none">
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        <input
          className={`w-full rounded-2xl border border-slate-200/60 bg-white/50 px-5 py-4 text-[15px] font-medium text-slate-900 placeholder:text-slate-400/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:bg-white/80 hover:border-slate-300/60 hover:shadow-md focus:border-indigo-500/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-xl ${
            Icon ? 'pl-11' : ''
          } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />
        {/* Inner shadow/highlight for depth */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 pointer-events-none" />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500 ml-1">{error}</p>}
    </div>
  );
};