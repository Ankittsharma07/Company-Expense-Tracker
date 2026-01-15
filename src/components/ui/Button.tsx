import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-b from-teal-500 to-teal-700 text-white shadow-[0_16px_30px_rgba(13,148,136,0.35)] hover:from-teal-400 hover:to-teal-600 hover:shadow-[0_20px_36px_rgba(13,148,136,0.45)] active:to-teal-700 active:shadow-[0_12px_22px_rgba(13,148,136,0.3)] border border-teal-500/40',
      secondary: 'bg-white/90 text-slate-700 border border-slate-200/80 hover:bg-white hover:text-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.08)] hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)]',
      outline: 'bg-transparent text-teal-700 border border-teal-200/70 hover:bg-teal-50/70 hover:border-teal-300/70 hover:shadow-[0_12px_22px_rgba(13,148,136,0.15)]',
      ghost: 'bg-transparent text-slate-500 hover:bg-slate-100/70 hover:text-slate-900',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-[0_10px_20px_rgba(220,38,38,0.25)]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium tracking-tight transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:ring-offset-0',
          'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
