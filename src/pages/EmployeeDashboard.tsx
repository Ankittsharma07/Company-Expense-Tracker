import React, { useState } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { ExpenseTable } from '../components/dashboard/ExpenseTable';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Wallet, Receipt } from 'lucide-react';

export const EmployeeDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-display">My Expenses</h1>
          <p className="text-slate-500">Track and submit your business expenses.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          New Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        <StatCard
          title="My Spending (YTD)"
          value="$3,450.00"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title="Pending Reimbursement"
          value="$145.50"
          icon={<Receipt className="w-5 h-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <ExpenseTable filterUser="Charlie Employee" />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Expense"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input type="text" className="w-full px-3 py-2 border border-slate-200/70 rounded-xl bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500/60 shadow-[0_6px_16px_rgba(15,23,42,0.06)]" placeholder="e.g. Client Lunch" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500">$</span>
                <input type="number" className="w-full pl-7 px-3 py-2 border border-slate-200/70 rounded-xl bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500/60 shadow-[0_6px_16px_rgba(15,23,42,0.06)]" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-200/70 rounded-xl bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500/60 shadow-[0_6px_16px_rgba(15,23,42,0.06)]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select className="w-full px-3 py-2 border border-slate-200/70 rounded-xl bg-white/80 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500/60 shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
              <option>Travel</option>
              <option>Meals</option>
              <option>Software</option>
              <option>Office Supplies</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
