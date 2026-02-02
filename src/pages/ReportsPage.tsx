import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileSpreadsheet, Download, Calendar, BarChart3, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF, fetchExpenses } from '../lib/api';
import type { Expense } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useToast } from '../components/ui/Toast';
import { downloadBlob, generateReportFilename } from '../lib/fileDownload';

const buildSummary = (expenses: Expense[]) => {
  const totals = {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  };

  expenses.forEach((expense) => {
    const amount = Number(expense.amount || 0);
    totals.total += amount;
    if (expense.status === 'APPROVED') {
      totals.approved += amount;
    } else if (expense.status === 'REJECTED') {
      totals.rejected += amount;
    } else {
      totals.pending += amount;
    }
  });

  return totals;
};

export const ReportsPage = () => {
  const { showToast, ToastComponent } = useToast();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState(() => buildSummary([]));

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      showToast('Please select a date range first', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchExpenses({ from: startDate, to: endDate });
      setExpenses(data);
      setSummary(buildSummary(data));
      showToast('Report preview generated', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate report';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!startDate || !endDate) {
      showToast('Please select a date range first', 'error');
      return;
    }
    setIsExportingExcel(true);
    try {
      const blob = await exportToExcel(startDate, endDate);
      downloadBlob(blob, generateReportFilename(startDate, endDate, 'xlsx'));
      showToast('Excel report downloaded successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export to Excel';
      showToast(message, 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (!startDate || !endDate) {
      showToast('Please select a date range first', 'error');
      return;
    }
    setIsExportingPDF(true);
    try {
      const blob = await exportToPDF(startDate, endDate);
      downloadBlob(blob, generateReportFilename(startDate, endDate, 'pdf'));
      showToast('PDF report downloaded successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export to PDF';
      showToast(message, 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {ToastComponent}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-display">Reports</h1>
          <p className="text-slate-500">Generate export-ready spend reports for your finance team.</p>
        </div>
        <BarChart3 className="w-8 h-8 text-teal-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/80 border border-slate-200/70 rounded-xl text-sm shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
              <Calendar className="w-4 h-4 text-slate-500" />
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

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleGenerate} isLoading={isLoading}>
                Generate Preview
              </Button>
              <Button
                variant="secondary"
                leftIcon={<FileSpreadsheet className="w-4 h-4" />}
                onClick={handleExportExcel}
                isLoading={isExportingExcel}
                disabled={isExportingExcel || isExportingPDF}
              >
                Export Excel
              </Button>
              <Button
                variant="primary"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExportPDF}
                isLoading={isExportingPDF}
                disabled={isExportingExcel || isExportingPDF}
              >
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Spend</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-slate-900">
            {formatCurrency(summary.total)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approved</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">
            {formatCurrency(summary.approved)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">
            {formatCurrency(summary.pending)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Report Preview</CardTitle>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FileText className="w-4 h-4" />
            {expenses.length} expenses
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Generate a report to preview expenses.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-3 text-sm text-slate-900">{expense.description}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{expense.category}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-slate-900">
                        {formatCurrency(Number(expense.amount || 0), expense.currency || 'USD')}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">{expense.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
