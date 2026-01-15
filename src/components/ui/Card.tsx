import React from 'react';
import { cn } from '../../lib/utils';

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-b from-white/95 via-white/90 to-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 ring-1 ring-white/60 shadow-[0_14px_34px_rgba(15,23,42,0.1)]",
        "before:content-[''] before:absolute before:inset-0 before:rounded-2xl before:bg-[radial-gradient(120%_120%_at_0%_0%,rgba(14,165,164,0.12),transparent_60%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none",
        "after:content-[''] after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/70 after:pointer-events-none",
        "hover:shadow-[0_20px_48px_rgba(15,23,42,0.14)] hover:-translate-y-0.5 transition-all duration-300 ease-out",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-white/80 to-slate-50/70 backdrop-blur-sm", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-base font-semibold text-slate-900 tracking-tight font-display", className)} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6", className)} {...props}>
    {children}
  </div>
);
