import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getExpenseDisplayValue } from '../../lib/expenseFx';
import { Check, X, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Expense } from '../../lib/api';

interface ExpenseTableProps {
  data: Expense[];
  limit?: number;
  showActions?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean | ((expense: Expense) => boolean);
  isLoading?: boolean;
  error?: string | null;
  onApprove?: (expense: Expense) => void;
  onReject?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  displayCurrency?: string;
}

const STATUS_MAP: Record<string, { label: string; badge: 'pending' | 'approved' | 'rejected' | 'default' }> = {
  // Current statuses
  PENDING_MANAGER: { label: 'Pending Manager', badge: 'pending' },
  PENDING_ADMIN: { label: 'Pending Admin', badge: 'pending' },
  APPROVED: { label: 'Approved', badge: 'approved' },
  REJECTED: { label: 'Rejected', badge: 'rejected' },
  // Legacy fallbacks
  PENDING: { label: 'Pending Manager', badge: 'pending' },
  MANAGER_APPROVED: { label: 'Pending Admin', badge: 'pending' },
  ADMIN_APPROVED: { label: 'Approved', badge: 'approved' },
};

export const ExpenseTable = ({
  data,
  limit,
  showActions,
  canEdit: canEditProp,
  canDelete: canDeleteProp,
  canApprove: canApproveProp,
  isLoading,
  error,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  displayCurrency,
}: ExpenseTableProps) => {
  const rows = limit ? data.slice(0, limit) : data;
  const canApprove = canApproveProp ?? Boolean(onApprove || onReject);
  const canEdit = canEditProp ?? Boolean(onEdit);
  const canDelete = canDeleteProp ?? Boolean(onDelete);
  const columnCount = showActions ? 7 : 6;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/60 bg-white/70 backdrop-blur-sm">
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Receipt</th>
            {showActions && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {isLoading && (
            <tr>
              <td className="px-6 py-6 text-sm text-slate-500" colSpan={columnCount}>
                Loading expenses...
              </td>
            </tr>
          )}
          {!isLoading && error && (
            <tr>
              <td className="px-6 py-6 text-sm text-rose-600" colSpan={columnCount}>
                {error}
              </td>
            </tr>
          )}
          {!isLoading && !error && rows.length === 0 && (
            <tr>
              <td className="px-6 py-6 text-sm text-slate-500" colSpan={columnCount}>
                No expenses found.
              </td>
            </tr>
          )}
          {!isLoading && !error && rows.map((expense) => {
            const statusKey = (expense.status || '').toString().toUpperCase();
            const statusConfig = STATUS_MAP[statusKey] || { label: expense.status, badge: 'default' };
            const isEditablePending = statusKey === 'PENDING_MANAGER' || statusKey === 'PENDING';
            const isApprovalStatus =
              statusKey === 'PENDING_MANAGER' ||
              statusKey === 'PENDING_ADMIN' ||
              statusKey === 'PENDING' ||
              statusKey === 'MANAGER_APPROVED';
            const canApproveForRow =
              typeof canApproveProp === 'function' ? canApproveProp(expense) : Boolean(canApprove);
            const canApproveRow = canApproveForRow && isApprovalStatus;
            const showFallback = !canApproveRow && !canEdit && !canDelete;
            return (
            <tr key={expense.id} className="hover:bg-white/80 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 text-sm">{expense.description}</span>
                  {expense.user && (
                    <span className="text-xs text-slate-500 mt-0.5">{expense.user.name}</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/80 text-slate-600 text-xs font-medium ring-1 ring-slate-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  {expense.category}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                {expense.expenseDate ? formatDate(expense.expenseDate) : '—'}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-900 text-sm">
                {(() => {
                  const { amount, currency } = getExpenseDisplayValue(expense, displayCurrency);
                  return formatCurrency(amount, currency);
                })()}
              </td>
              <td className="px-6 py-4">
                <Badge status={statusConfig.badge}>{statusConfig.label}</Badge>
              </td>
              <td className="px-6 py-4 text-sm">
                {expense.receiptUrl ? (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-slate-400">â€”</span>
                )}
              </td>
              {showActions && (
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    {canApproveRow && (
                      <>
                        {onApprove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50/70"
                            onClick={() => onApprove(expense)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {onReject && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50/70"
                            onClick={() => onReject(expense)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-premium-purple-600"
                        onClick={() => onEdit?.(expense)}
                        disabled={!isEditablePending}
                        title={!isEditablePending ? "Only pending expenses can be edited" : "Edit expense"}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50/70"
                        onClick={() => onDelete?.(expense)}
                        disabled={!isEditablePending}
                        title={!isEditablePending ? "Only pending expenses can be deleted" : "Delete expense"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {/* Only show 3-dot menu if there are no other actions available */}
                    {showFallback && (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </div>
                </td>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
