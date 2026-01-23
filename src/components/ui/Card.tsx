import React from 'react';
import { cn } from '../../lib/utils';

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "group relative overflow-hidden",
        "bg-white/80 backdrop-blur-xl",
        "rounded-3xl border border-white/60",
        "shadow-[0_8px_32px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)]",
        "before:content-[''] before:absolute before:inset-0 before:rounded-3xl",
        "before:bg-gradient-to-br before:from-white/60 before:via-white/30 before:to-transparent",
        "before:opacity-100 before:pointer-events-none",
        "after:content-[''] after:absolute after:inset-0 after:rounded-3xl",
        "after:bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(102,126,234,0.08),transparent_40%)]",
        "after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500 after:pointer-events-none",
        "hover:shadow-[0_20px_60px_rgba(15,23,42,0.12),0_8px_16px_rgba(102,126,234,0.12)]",
        "hover:-translate-y-1 hover:scale-[1.01]",
        "transition-all duration-500 ease-out",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/40 pointer-events-none" />
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(
    "relative px-6 py-5 border-b border-slate-100/50",
    "bg-gradient-to-r from-white/40 via-white/20 to-transparent",
    "backdrop-blur-sm",
    className
  )} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn(
    "text-base font-semibold text-slate-900 tracking-tight font-display",
    "bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text",
    className
  )} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("relative p-6 z-10", className)} {...props}>
    {children}
  </div>
);
