import React, { useState, useEffect, useMemo } from 'react';
import { fetchExpenses, approveExpenseById, rejectExpenseById, Expense } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { ExpenseTable } from '../components/dashboard/ExpenseTable';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';

type TabType = 'pending' | 'approved' | 'rejected';

const ApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { displayCurrency } = useDisplayCurrency();

  // Load expenses
  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to load approvals';
      setError(errMessage);
      showToast(errMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const statusBuckets = useMemo(() => {
    if (user?.role === 'MANAGER') {
      return {
        pending: new Set(['PENDING_MANAGER', 'PENDING']),
        approved: new Set(['PENDING_ADMIN', 'APPROVED', 'MANAGER_APPROVED']),
        rejected: new Set(['REJECTED']),
      };
    }
    if (user?.role === 'ADMIN') {
      return {
        pending: new Set(['PENDING_ADMIN', 'MANAGER_APPROVED']),
        approved: new Set(['APPROVED', 'ADMIN_APPROVED']),
        rejected: new Set(['REJECTED']),
      };
    }
    return {
      pending: new Set<string>(),
      approved: new Set<string>(),
      rejected: new Set<string>(),
    };
  }, [user?.role]);

  // Filter expenses by tab
  const filteredExpenses = useMemo(() => {
    const set = statusBuckets[activeTab];
    return expenses.filter(exp => set.has(exp.status));
  }, [expenses, activeTab, statusBuckets]);

  // Handle approve
  const handleApprove = async (expense: Expense) => {
    if (!user) return;
    
    setActionLoading(expense.id);
    try {
      await approveExpenseById(expense.id, user.role as "MANAGER" | "ADMIN");
      showToast('Expense approved successfully!', 'success');
      await loadExpenses();
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to approve expense';
      showToast(errMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject
  const handleReject = async (expense: Expense) => {
    if (!user) return;
    
    const reason = prompt('Rejection reason (optional):');
    
    setActionLoading(expense.id);
    try {
      await rejectExpenseById(expense.id, user.role as "MANAGER" | "ADMIN", reason || undefined);
      showToast('Expense rejected successfully!', 'success');
      await loadExpenses();
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to reject expense';
      showToast(errMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Check if user can approve based on role and expense status
  const canApprove = (expense: Expense): boolean => {
    if (!user) return false;
    if (user.role === 'MANAGER' && expense.status === 'PENDING_MANAGER') return true;
    if (user.role === 'ADMIN' && expense.status === 'PENDING_ADMIN') return true;
    return false;
  };

  // Tab configuration
  const tabs: { key: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { 
      key: 'pending', 
      label: 'Pending', 
      icon: <Clock className="w-4 h-4" />,
      count: expenses.filter(exp => statusBuckets.pending.has(exp.status)).length
    },
    { 
      key: 'approved', 
      label: 'Approved', 
      icon: <CheckCircle className="w-4 h-4" />,
      count: expenses.filter(exp => statusBuckets.approved.has(exp.status)).length
    },
    { 
      key: 'rejected', 
      label: 'Rejected', 
      icon: <XCircle className="w-4 h-4" />,
      count: expenses.filter(exp => statusBuckets.rejected.has(exp.status)).length
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {ToastComponent}
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight font-display">Approvals</h1>
          <p className="text-slate-500 mt-1">Review and approve expense submissions</p>
        </div>
        <FileText className="w-8 h-8 text-cyan-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200/60">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all
              ${activeTab === tab.key
                ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-semibold
              ${activeTab === tab.key ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'}
            `}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200/60">
          <div className="text-slate-400 mb-2">
            {activeTab === 'pending' && <Clock className="w-12 h-12 mx-auto mb-3" />}
            {activeTab === 'approved' && <CheckCircle className="w-12 h-12 mx-auto mb-3" />}
            {activeTab === 'rejected' && <XCircle className="w-12 h-12 mx-auto mb-3" />}
          </div>
          <p className="text-slate-600 font-medium">No {activeTab} expenses</p>
          <p className="text-slate-400 text-sm mt-1">
            {activeTab === 'pending'
              ? 'All caught up! No expenses waiting for approval.'
              : `No expenses have been ${activeTab} yet.`}
          </p>
        </div>
      ) : (
        <ExpenseTable
          data={filteredExpenses}
          displayCurrency={displayCurrency}
          showActions={activeTab === 'pending'}
          canApprove={(expense) => canApprove(expense)}
          onApprove={handleApprove}
          onReject={handleReject}
          canEdit={false}
          canDelete={false}
        />
      )}
    </div>
  );
};

export default ApprovalsPage;
