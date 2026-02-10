import React, { useCallback, useMemo, useState } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { SpendTrendChart, CategoryPieChart } from '../components/dashboard/Charts';
import { ExpenseTable } from '../components/dashboard/ExpenseTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DollarSign, FileText, Users, TrendingUp, Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { approveExpense, fetchCategoryTotals, fetchExpenses, fetchMonthlyTotals, fetchUsers, fetchApprovalCounts, exportToExcel, exportToPDF } from '../lib/api';
import type { ApiUser, CategoryTotal, Expense, MonthlyTotal } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';
import { downloadBlob, generateReportFilename } from '../lib/fileDownload';

export const AdminDashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  // Date range state for exports
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { showToast, ToastComponent } = useToast();
  const { displayCurrency } = useDisplayCurrency();

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const year = new Date().getFullYear();
      const [expenseData, monthlyData, categoryData, userData, approvalCounts] = await Promise.all([
        fetchExpenses(),
        fetchMonthlyTotals(year, displayCurrency),
        fetchCategoryTotals(undefined, undefined, displayCurrency),
        fetchUsers(),
        fetchApprovalCounts(),
      ]);
      setExpenses(expenseData);
      setMonthlyTotals(monthlyData);
      setCategoryTotals(categoryData);
      setUsers(userData);
      setPendingApprovalsCount(approvalCounts.pending);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to load dashboard data.';
      const message = errMessage === 'unauthorized'
        ? 'Session expired. Please sign in again.'
        : errMessage;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [displayCurrency]);

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

  const monthlyTotalsDisplay = useMemo(() => monthlyTotals, [monthlyTotals]);

  const categoryTotalsDisplay = useMemo(() => categoryTotals, [categoryTotals]);

  const monthlyCurrency = useMemo(
    () => monthlyTotals[0]?.currency || displayCurrency,
    [monthlyTotals, displayCurrency]
  );

  const categoryCurrency = useMemo(
    () => categoryTotals[0]?.currency || displayCurrency,
    [categoryTotals, displayCurrency]
  );

  // Pending approvals count is now fetched from backend

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

  // Export to Excel handler
  const handleExportExcel = async () => {
    if (!startDate || !endDate) {
      showToast('Please select a date range first', 'error');
      return;
    }

    setIsExportingExcel(true);
    try {
      const blob = await exportToExcel(startDate, endDate, displayCurrency);
      const filename = generateReportFilename(startDate, endDate, 'xlsx');
      downloadBlob(blob, filename);
      showToast('Excel report downloaded successfully!', 'success');
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to export to Excel';
      showToast(errMessage, 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export to PDF handler
  const handleExportPDF = async () => {
    if (!startDate || !endDate) {
      showToast('Please select a date range first', 'error');
      return;
    }

    setIsExportingPDF(true);
    try {
      const blob = await exportToPDF(startDate, endDate, displayCurrency);
      const filename = generateReportFilename(startDate, endDate, 'pdf');
      downloadBlob(blob, filename);
      showToast('PDF report downloaded successfully!', 'success');
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to export to PDF';
      showToast(errMessage, 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Format date range display
  const dateRangeDisplay = useMemo(() => {
    if (!startDate || !endDate) return 'Select date range';
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${start} - ${end}`;
  }, [startDate, endDate]);

  // Initialize date range to last 3 months
  React.useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight font-display">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your company's financial health.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-3 py-2 bg-white/80 border border-slate-200/70 rounded-xl text-sm shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
            <Calendar className="w-4 h-4 text-slate-500 hidden sm:block" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          </div>

          {/* Export Buttons */}
          <Button
            variant="secondary"
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={handleExportExcel}
            isLoading={isExportingExcel}
            disabled={!startDate || !endDate || isExportingExcel || isExportingPDF}
          >
            Export
          </Button>
          <Button
            variant="primary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportPDF}
            isLoading={isExportingPDF}
            disabled={!startDate || !endDate || isExportingExcel || isExportingPDF}
          >
            Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <StatCard
          title="Total Spend"
          value={isLoading ? '—' : formatCurrency(totalSpend, monthlyCurrency)}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Pending Approvals"
          value={isLoading ? '—' : pendingApprovalsCount.toString()}
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
          value={isLoading ? '—' : formatCurrency(monthlyAverage, monthlyCurrency)}
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
              <SpendTrendChart data={monthlyTotalsDisplay} currency={monthlyCurrency} />
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
              <CategoryPieChart data={categoryTotalsDisplay} currency={categoryCurrency} />
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
            className="text-premium-purple-700 hover:text-premium-purple-800 hover:bg-premium-purple-50/70"
            onClick={() => setShowAllExpenses(!showAllExpenses)}
          >
            {showAllExpenses ? 'Show Less' : 'View All'}
          </Button>
        </CardHeader>
        <ExpenseTable
          data={expenses}
          displayCurrency={displayCurrency}
          limit={showAllExpenses ? undefined : 5}
          showActions={true}
          isLoading={isLoading}
          error={error}
          canApprove={(expense) => expense.status === 'PENDING_ADMIN'}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </Card>
    </div>
  );
};
