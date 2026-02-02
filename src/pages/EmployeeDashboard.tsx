import React, { useCallback, useMemo, useState } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { ExpenseTable } from '../components/dashboard/ExpenseTable';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Wallet, Receipt } from 'lucide-react';
import { createExpense, deleteExpense, fetchExpenses, updateExpense } from '../lib/api';
import type { Expense } from '../lib/api';
import { formatCurrency, getCurrencySymbol } from '../lib/utils';

export const EmployeeDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formState, setFormState] = useState({
    description: '',
    amount: '',
    date: '',
    currency: 'USD',
    category: 'Travel',
    receiptFile: null as File | null,
    removeReceipt: false,
  });

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

  const displayCurrency = useMemo(() => {
    return expenses.find((expense) => expense.currency)?.currency || 'USD';
  }, [expenses]);

  const totalSpend = useMemo(() => {
    return expenses
      .filter((expense) => expense.status !== 'REJECTED')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  const pendingReimbursement = useMemo(() => {
    const pendingStatuses = new Set(['PENDING_MANAGER', 'PENDING_ADMIN', 'PENDING']);
    return expenses
      .filter((expense) => pendingStatuses.has(expense.status))
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenses]);

  const resetForm = () => {
    setFormState({
      description: '',
      amount: '',
      date: '',
      currency: 'USD',
      category: 'Travel',
      receiptFile: null,
      removeReceipt: false,
    });
    setEditingExpense(null);
  };

  const openNewExpense = () => {
    setError(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditExpense = (expense: Expense) => {
    setError(null);
    setEditingExpense(expense);
    setFormState({
      description: expense.description,
      amount: String(expense.amount ?? ''),
      date: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : '',
      currency: expense.currency || 'USD',
      category: expense.category,
      receiptFile: null,
      removeReceipt: false,
    });
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      await deleteExpense(expense.id);
      await loadExpenses();
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to delete expense.';
      setError(errMessage);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const amountValue = Number(formState.amount);
    if (!formState.description || Number.isNaN(amountValue)) {
      setError('Please enter a valid description and amount.');
      return;
    }

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          description: formState.description,
          category: formState.category,
          amount: amountValue,
          currency: formState.currency,
          expenseDate: formState.date ? new Date(formState.date).toISOString() : undefined,
          receiptFile: formState.receiptFile,
          removeReceipt: formState.removeReceipt,
        });
      } else {
        await createExpense({
          description: formState.description,
          category: formState.category,
          amount: amountValue,
          currency: formState.currency,
          expenseDate: formState.date ? new Date(formState.date).toISOString() : undefined,
          receiptFile: formState.receiptFile,
        });
      }
      setIsModalOpen(false);
      resetForm();
      await loadExpenses();
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to save expense.';
      setError(errMessage);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-display">My Expenses</h1>
          <p className="text-slate-500">Track and submit your business expenses.</p>
        </div>
        <Button onClick={openNewExpense} leftIcon={<Plus className="w-4 h-4" />}>
          New Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        <StatCard
          title="My Spending (YTD)"
          value={isLoading ? '—' : formatCurrency(totalSpend, displayCurrency)}
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title="Pending Reimbursement"
          value={isLoading ? '—' : formatCurrency(pendingReimbursement, displayCurrency)}
          icon={<Receipt className="w-5 h-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <ExpenseTable
          data={expenses}
          showActions={true}
          canEdit={true}
          canDelete={true}
          isLoading={isLoading}
          error={error}
          onEdit={openEditExpense}
          onDelete={handleDeleteExpense}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
          setError(null);
        }}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="text-sm text-rose-600">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={formState.description}
              onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200/70 rounded-xl bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500/60 shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
              placeholder="e.g. Client Lunch"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500">{getCurrencySymbol(formState.currency)}</span>
                <input
                  type="number"
                  value={formState.amount}
                  onChange={(e) => setFormState((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full pl-7 px-3 py-2 border border-slate-200/70 rounded-xl bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500/60 shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
              <select
                value={formState.currency}
                onChange={(e) => setFormState((prev) => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200/70 rounded-xl bg-white/80 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500/60 shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={formState.date}
                onChange={(e) => setFormState((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200/70 rounded-xl bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500/60 shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={formState.category}
              onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200/70 rounded-xl bg-white/80 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500/60 shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
            >
              <option value="Travel">Travel</option>
              <option value="Meals">Meals</option>
              <option value="Software">Software</option>
              <option value="Office Supplies">Office Supplies</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {editingExpense ? 'Replace Receipt (optional)' : 'Receipt (optional)'}
            </label>
            {editingExpense?.receiptUrl && !formState.removeReceipt && (
              <div className="flex items-center gap-3 mb-2">
                <a
                  href={editingExpense.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-xs text-teal-600 hover:text-teal-700"
                >
                  View current receipt
                </a>
                <button
                  type="button"
                  className="text-xs text-rose-600 hover:text-rose-700"
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      removeReceipt: true,
                      receiptFile: null,
                    }))
                  }
                >
                  Remove receipt
                </button>
              </div>
            )}
            {editingExpense?.receiptUrl && formState.removeReceipt && (
              <div className="flex items-center gap-2 mb-2 text-xs text-rose-600">
                <span>Receipt will be removed on save.</span>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-700"
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      removeReceipt: false,
                    }))
                  }
                >
                  Undo
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  receiptFile: e.target.files?.[0] || null,
                  removeReceipt: false,
                }))
              }
              className="w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            <p className="mt-1 text-xs text-slate-500">Accepted: JPG, PNG, PDF. Max 5MB.</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{editingExpense ? 'Save Changes' : 'Submit Expense'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
