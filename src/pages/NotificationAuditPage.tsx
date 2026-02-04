import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { fetchNotificationAuditLogs, NotificationAuditLog } from '../lib/api';
import { Bell, Mail, Check, X, Clock } from 'lucide-react';

export const NotificationAuditPage = () => {
    const [logs, setLogs] = useState<NotificationAuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadLogs();
    }, [page]);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const response = await fetchNotificationAuditLogs({ page, limit: 50 });
            setLogs(response.logs);
            setTotalPages(response.pagination.totalPages);
        } catch (error) {
            console.error('Failed to load notification logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getChannelIcon = (channel: string) => {
        if (channel === 'EMAIL') return <Mail className="w-4 h-4" />;
        return <Bell className="w-4 h-4" />;
    };

    const getStatusBadge = (status: string) => {
        if (status === 'SENT') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                    <Check className="w-3 h-3" />
                    Sent
                </span>
            );
        }
        if (status === 'FAILED') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium">
                    <X className="w-3 h-3" />
                    Failed
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-md text-xs font-medium">
                <Clock className="w-3 h-3" />
                Pending
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 font-display">Notification Audit Log</h1>
                <p className="text-slate-500 mt-1">Track all notifications sent to users in your company</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Notification History</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-sm text-slate-500">Loading logs...</p>
                            </div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No notification logs found</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">User</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Type</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Channel</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Sent At</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{log.user.name}</p>
                                                        <p className="text-xs text-slate-500">{log.user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-slate-700">{log.notificationType}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                                        {getChannelIcon(log.channel)}
                                                        {log.channel}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getStatusBadge(log.status)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-slate-600">{formatDate(log.createdAt)}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {log.reason ? (
                                                        <span className="text-xs text-slate-500">{log.reason}</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                                    <p className="text-sm text-slate-500">
                                        Page {page} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage(page + 1)}
                                            disabled={page >= totalPages}
                                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
