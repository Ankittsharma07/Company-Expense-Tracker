import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'default';
  children: React.ReactNode;
  className?: string;
}

export const Badge = ({ status, children, className }: BadgeProps) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    rejected: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
    default: 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
        styles[status],
        className
      )}
    >
      {children}
    </span>
  );
};
