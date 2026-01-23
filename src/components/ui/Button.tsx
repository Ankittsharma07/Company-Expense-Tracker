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
      primary: 'relative overflow-hidden bg-gradient-to-br from-premium-purple-500 via-premium-blue-500 to-premium-purple-600 text-white shadow-[0_8px_24px_rgba(102,126,234,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_16px_40px_rgba(102,126,234,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] active:shadow-[0_4px_16px_rgba(102,126,234,0.35)] border border-premium-purple-400/30 hover:border-premium-purple-300/40 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
      secondary: 'bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200/60 hover:bg-white hover:text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,1)] hover:border-slate-300/60',
      outline: 'bg-transparent text-premium-purple-700 border border-premium-purple-200/70 hover:bg-gradient-to-br hover:from-premium-purple-50/80 hover:to-premium-blue-50/80 hover:border-premium-purple-300/80 hover:shadow-[0_8px_24px_rgba(102,126,234,0.2)] backdrop-blur-sm',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 backdrop-blur-sm',
      danger: 'bg-gradient-to-br from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 shadow-[0_8px_24px_rgba(244,63,94,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_12px_32px_rgba(244,63,94,0.4)] border border-rose-400/30',
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
          'inline-flex items-center justify-center rounded-xl font-semibold tracking-tight',
          'transition-all duration-300 ease-out',
          'hover:-translate-y-1 hover:scale-[1.02]',
          'active:translate-y-0 active:scale-100',
          'focus:outline-none focus:ring-2 focus:ring-premium-purple-500/40 focus:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:transform-none',
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
