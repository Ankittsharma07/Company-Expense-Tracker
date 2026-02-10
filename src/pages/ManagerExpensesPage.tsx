import React, { useCallback, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { ExpenseTable } from '../components/dashboard/ExpenseTable';
import { fetchExpenses } from '../lib/api';
import type { Expense } from '../lib/api';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';

export const ManagerExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { displayCurrency } = useDisplayCurrency();

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

    const intervalId = setInterval(() => {
      loadExpenses();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadExpenses]);

  const totalCount = useMemo(() => expenses.length, [expenses]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 font-display">Team Expenses</h1>
        <p className="text-slate-500">Review submitted expenses across your team.</p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>All Expenses</CardTitle>
          <span className="text-xs text-slate-500">{totalCount} items</span>
        </CardHeader>
        <ExpenseTable
          data={expenses}
          displayCurrency={displayCurrency}
          showActions={false}
          isLoading={isLoading}
          error={error}
        />
      </Card>
    </div>
  );
};
