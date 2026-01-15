import React from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { ExpenseTable } from '../components/dashboard/ExpenseTable';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const ManagerDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Approvals</h1>
        <p className="text-gray-500">Manage your team's expenses and requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Pending Review"
          value="8"
          icon={<Clock className="w-5 h-5" />}
          className="bg-amber-50/50 border-amber-100"
        />
        <StatCard
          title="Approved this Month"
          value="$4,250"
          icon={<CheckCircle2 className="w-5 h-5" />}
          className="bg-emerald-50/50 border-emerald-100"
        />
        <StatCard
          title="Rejected"
          value="2"
          icon={<AlertCircle className="w-5 h-5" />}
          className="bg-red-50/50 border-red-100"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <ExpenseTable showActions={true} />
      </Card>
    </div>
  );
};
