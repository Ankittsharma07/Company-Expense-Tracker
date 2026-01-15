import React from 'react';
import { EXPENSES } from '../../data/mockData';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Eye, Check, X, MoreHorizontal } from 'lucide-react';

interface ExpenseTableProps {
  limit?: number;
  showActions?: boolean;
  filterUser?: string;
}

export const ExpenseTable = ({ limit, showActions, filterUser }: ExpenseTableProps) => {
  let data = EXPENSES;
  if (filterUser) {
    data = data.filter(e => e.user === filterUser);
  }
  if (limit) {
    data = data.slice(0, limit);
  }

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
            {showActions && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {data.map((expense) => (
            <tr key={expense.id} className="hover:bg-white/80 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 text-sm">{expense.description}</span>
                  <span className="text-xs text-slate-500 mt-0.5">{expense.user}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/80 text-slate-600 text-xs font-medium ring-1 ring-slate-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  {expense.category}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500 font-mono">{formatDate(expense.date)}</td>
              <td className="px-6 py-4 font-semibold text-slate-900 text-sm">{formatCurrency(expense.amount)}</td>
              <td className="px-6 py-4">
                <Badge status={expense.status as any}>{expense.status}</Badge>
              </td>
              {showActions && (
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-teal-600">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {expense.status === 'pending' ? (
                      <>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50/70">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50/70">
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
