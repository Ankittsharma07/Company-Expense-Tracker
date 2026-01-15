import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'default';
  children: React.ReactNode;
  className?: string;
}

export const Badge = ({ status, children, className }: BadgeProps) => {
  const styles = {
    pending: 'bg-amber-50/80 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    approved: 'bg-emerald-50/80 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    rejected: 'bg-rose-50/80 text-rose-700 ring-1 ring-inset ring-rose-600/20',
    default: 'bg-slate-50/80 text-slate-600 ring-1 ring-inset ring-slate-500/10',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        styles[status],
        className
      )}
    >
      {children}
    </span>
  );
};
