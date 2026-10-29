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
  const baseStyles = "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:pointer-events-none select-none relative overflow-hidden active:scale-[0.98]";
  
  const variants = {
    // iOS 26 / VisionOS Primary
    primary: "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_12px_28px_-6px_rgba(79,70,229,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-105 border border-indigo-600/10 hover:-translate-y-0.5",
    
    // Glass Secondary
    secondary: "bg-white/70 backdrop-blur-md text-slate-700 border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:bg-white hover:text-slate-900 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-white hover:-translate-y-0.5",
    
    // Outline
    outline: "border border-slate-300/60 bg-transparent text-slate-600 hover:bg-white/50 hover:text-slate-900 hover:border-slate-400",
    
    // Ghost
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100/50 hover:text-slate-900",
    
    // Danger
    danger: "bg-red-50/50 text-red-600 border border-red-100 hover:bg-red-100/80 hover:border-red-200 shadow-sm",
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