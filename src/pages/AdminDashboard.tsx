import React from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { SpendTrendChart, CategoryPieChart } from '../components/dashboard/Charts';
import { ExpenseTable } from '../components/dashboard/ExpenseTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DollarSign, FileText, Users, TrendingUp, Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { STATS } from '../data/mockData';
import { formatCurrency } from '../lib/utils';

export const AdminDashboard = () => {
  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight font-display">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your company's financial health.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/80 border border-slate-200/70 rounded-xl text-sm text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.06)] mr-2">
            <Calendar className="w-4 h-4" />
            <span>Oct 2023 - Nov 2023</span>
          </div>
          <Button variant="secondary" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="primary" leftIcon={<Download className="w-4 h-4" />}>
            Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <StatCard
          title="Total Spend"
          value={formatCurrency(STATS.totalSpend)}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Pending Approvals"
          value={STATS.pendingApprovals.toString()}
          icon={<FileText className="w-5 h-5" />}
          trend={{ value: 2.1, isPositive: false }}
        />
        <StatCard
          title="Active Employees"
          value={STATS.activeEmployees.toString()}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 4.5, isPositive: true }}
        />
        <StatCard
          title="Monthly Average"
          value={formatCurrency(STATS.monthlyAverage)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-children">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spend Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendTrendChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" className="text-teal-700 hover:text-teal-800 hover:bg-teal-50/70">View All</Button>
        </CardHeader>
        <ExpenseTable limit={5} showActions={true} />
      </Card>
    </div>
  );
};
