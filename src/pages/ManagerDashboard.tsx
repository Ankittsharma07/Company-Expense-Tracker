import React, { useCallback, useMemo, useState } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { ExpenseTable } from '../components/dashboard/ExpenseTable';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { approveExpense, fetchExpenses } from '../lib/api';
import type { Expense } from '../lib/api';

export const ManagerDashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to load expenses.';
      setError(errMessage === 'unauthorized' ? 'Session expired. Please sign in again.' : errMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadExpenses();

    // Set up polling for real-time updates every 30 seconds
    const intervalId = setInterval(() => {
      loadExpenses();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [loadExpenses]);

  const pendingReview = useMemo(() => {
    return expenses.filter((expense) => expense.status === 'PENDING').length;
  }, [expenses]);

  const rejectedCount = useMemo(() => {
    return expenses.filter((expense) => expense.status === 'REJECTED').length;
  }, [expenses]);

  const approvedThisMonth = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return expenses
      .filter((expense) => ['MANAGER_APPROVED', 'ADMIN_APPROVED'].includes(expense.status))
      .filter((expense) => {
        const created = new Date(expense.createdAt);
        return created.getMonth() === month && created.getFullYear() === year;
      })
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  const pendingExpenses = useMemo(() => {
    return expenses.filter((expense) => expense.status === 'PENDING');
  }, [expenses]);

  const handleApprove = async (expense: Expense) => {
    try {
      await approveExpense(expense.id, 'manager', { decision: 'approve' });
      await loadExpenses();
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to approve expense.';
      setError(errMessage);
    }
  };

  const handleReject = async (expense: Expense) => {
    try {
      await approveExpense(expense.id, 'manager', { decision: 'reject' });
      await loadExpenses();
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to reject expense.';
      setError(errMessage);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 font-display">Team Approvals</h1>
        <p className="text-slate-500">Manage your team's expenses and requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <StatCard
          title="Pending Review"
          value={isLoading ? '—' : pendingReview.toString()}
          icon={<Clock className="w-5 h-5" />}
          className="bg-amber-50/70 border-amber-100/70"
        />
        <StatCard
          title="Approved this Month"
          value={isLoading ? '—' : formatCurrency(approvedThisMonth)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          className="bg-emerald-50/70 border-emerald-100/70"
        />
        <StatCard
          title="Rejected"
          value={isLoading ? '—' : rejectedCount.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
          className="bg-rose-50/70 border-rose-100/70"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <ExpenseTable
          data={pendingExpenses}
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
