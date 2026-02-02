import React from 'react';
import { cn } from '../../lib/utils';

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | string;

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 ring-red-200',
  MANAGER: 'bg-blue-100 text-blue-700 ring-blue-200',
  EMPLOYEE: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

export const RoleBadge = ({ role, className }: { role: Role; className?: string }) => {
  const normalized = role.toUpperCase();
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset',
        ROLE_STYLES[normalized] || 'bg-slate-100 text-slate-700 ring-slate-200',
        className
      )}
    >
      {normalized}
    </span>
  );
};
