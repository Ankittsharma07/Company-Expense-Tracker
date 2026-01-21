import React, { useCallback, useMemo, useState } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { SpendTrendChart, CategoryPieChart } from '../components/dashboard/Charts';
import { ExpenseTable } from '../components/dashboard/ExpenseTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DollarSign, FileText, Users, TrendingUp, Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { approveExpense, fetchCategoryTotals, fetchExpenses, fetchMonthlyTotals, fetchUsers } from '../lib/api';
import type { ApiUser, CategoryTotal, Expense, MonthlyTotal } from '../lib/api';

export const AdminDashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const year = new Date().getFullYear();
      const [expenseData, monthlyData, categoryData, userData] = await Promise.all([
        fetchExpenses(),
        fetchMonthlyTotals(year),
        fetchCategoryTotals(),
        fetchUsers(),
      ]);
      setExpenses(expenseData);
      setMonthlyTotals(monthlyData);
      setCategoryTotals(categoryData);
      setUsers(userData);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to load dashboard data.';
      const message = errMessage === 'unauthorized'
        ? 'Session expired. Please sign in again.'
        : errMessage;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboard();

    // Set up polling for real-time updates every 30 seconds
    const intervalId = setInterval(() => {
      loadDashboard();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [loadDashboard]);

  const totalSpend = useMemo(() => {
    return monthlyTotals.reduce((sum, entry) => sum + Number(entry.total || 0), 0);
  }, [monthlyTotals]);

  const monthlyAverage = useMemo(() => {
    if (!monthlyTotals.length) return 0;
    return totalSpend / monthlyTotals.length;
  }, [monthlyTotals, totalSpend]);

  const pendingApprovals = useMemo(() => {
    return expenses.filter((expense) => ['PENDING', 'MANAGER_APPROVED'].includes(expense.status)).length;
  }, [expenses]);

  const activeEmployees = useMemo(() => {
    return users.filter((user) => user.role !== 'ADMIN').length;
  }, [users]);

  const handleApprove = async (expense: Expense) => {
    try {
      await approveExpense(expense.id, 'admin', { decision: 'approve' });
      await loadDashboard();
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to approve expense.';
      setError(errMessage);
    }
  };

  const handleReject = async (expense: Expense) => {
    try {
      await approveExpense(expense.id, 'admin', { decision: 'reject' });
      await loadDashboard();
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to reject expense.';
      setError(errMessage);
    }
  };

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
          value={isLoading ? '—' : formatCurrency(totalSpend)}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Pending Approvals"
          value={isLoading ? '—' : pendingApprovals.toString()}
          icon={<FileText className="w-5 h-5" />}
          trend={{ value: 2.1, isPositive: false }}
        />
        <StatCard
          title="Active Employees"
          value={isLoading ? '—' : activeEmployees.toString()}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 4.5, isPositive: true }}
        />
        <StatCard
          title="Monthly Average"
          value={isLoading ? '—' : formatCurrency(monthlyAverage)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-children">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spend Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-sm text-slate-500">Loading chart...</div>
            ) : error ? (
              <div className="py-10 text-sm text-rose-600">{error}</div>
            ) : (
              <SpendTrendChart data={monthlyTotals} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-sm text-slate-500">Loading chart...</div>
            ) : error ? (
              <div className="py-10 text-sm text-rose-600">{error}</div>
            ) : (
              <CategoryPieChart data={categoryTotals} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-teal-700 hover:text-teal-800 hover:bg-teal-50/70"
            onClick={() => setShowAllExpenses(!showAllExpenses)}
          >
            {showAllExpenses ? 'Show Less' : 'View All'}
          </Button>
        </CardHeader>
        <ExpenseTable
          data={expenses}
          limit={showAllExpenses ? undefined : 5}
          showActions={true}
          isLoading={isLoading}
          error={error}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </Card>
    </div>
  );
};
