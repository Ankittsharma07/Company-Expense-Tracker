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
    <Card className={cn("group overflow-hidden", className)}>
      <CardContent className="p-6">
        {/* Animated gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-premium-purple-500/5 via-premium-blue-500/5 to-premium-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            {/* Icon with premium styling */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-premium-purple-500/20 to-premium-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className={cn(
                "relative p-3 rounded-2xl",
                "bg-gradient-to-br from-white/90 to-white/60",
                "backdrop-blur-sm",
                "border border-white/60",
                "shadow-[0_8px_16px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]",
                "text-slate-600",
                "group-hover:shadow-[0_12px_24px_rgba(102,126,234,0.2),inset_0_1px_0_rgba(255,255,255,0.9)]",
                "group-hover:text-premium-purple-600",
                "group-hover:scale-110",
                "transition-all duration-500"
              )}>
                {icon}
              </div>
            </div>

            {/* Trend badge */}
            {trend && (
              <div className={cn(
                "flex items-center text-xs font-semibold px-3 py-1.5 rounded-full",
                "backdrop-blur-sm border shadow-sm",
                "transition-all duration-300",
                trend.isPositive
                  ? "text-emerald-700 bg-emerald-50/80 border-emerald-200/60 shadow-emerald-100/50"
                  : "text-rose-700 bg-rose-50/80 border-rose-200/60 shadow-rose-100/50"
              )}>
                {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">{title}</p>
            <h4 className={cn(
              "text-3xl font-bold tracking-tight font-display",
              "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700",
              "bg-clip-text text-transparent",
              "group-hover:from-premium-purple-600 group-hover:via-premium-blue-600 group-hover:to-premium-pink-600",
              "transition-all duration-500"
            )}>
              {value}
            </h4>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
