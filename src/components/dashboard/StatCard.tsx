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
          <div className="p-2.5 bg-gray-50 rounded-lg text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-300">
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium px-2 py-1 rounded-full border",
              trend.isPositive 
                ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                : "text-red-700 bg-red-50 border-red-100"
            )}>
              {trend.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h4 className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-indigo-900 transition-colors">{value}</h4>
        </div>
      </CardContent>
    </Card>
  );
};
