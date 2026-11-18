import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading,
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none select-none relative overflow-hidden active:scale-[0.98] whitespace-nowrap shrink-0";
  
  const variants = {
    // Theme-aware Primary
    primary: "theme-accent-bg shadow-sm hover:brightness-105 border border-black/5 dark:border-white/10 hover:-translate-y-0.5",
    
    // Glass Secondary
    secondary: "bg-white/85 dark:bg-slate-800/90 backdrop-blur-md text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
    
    // Outline
    outline: "border border-slate-300/80 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800 hover:border-slate-400",
    
    // Ghost
    ghost: "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
    
    // Danger
    danger: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-xs",
  };

  const sizes = {
    sm: "h-8 px-4 text-xs",
    md: "h-12 px-6 text-[15px]",
    lg: "h-14 px-8 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
};