import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  className?: string;
}

export const StatCard = ({ title, value, trend, icon, className }: StatCardProps) => {
  return (
      <Card className={cn("group", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 bg-white/80 rounded-xl text-slate-500 ring-1 ring-slate-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_18px_rgba(15,23,42,0.08)] group-hover:bg-teal-50/80 group-hover:text-teal-700 transition-colors duration-300">
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium px-2.5 py-1 rounded-full border",
              trend.isPositive 
                ? "text-emerald-700 bg-emerald-50/80 border-emerald-100/80" 
                : "text-rose-700 bg-rose-50/80 border-rose-100/80"
            )}>
              {trend.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h4 className="text-[28px] font-semibold text-slate-900 tracking-tight font-display group-hover:text-teal-700 transition-colors">{value}</h4>
        </div>
      </CardContent>
    </Card>
  );
};
