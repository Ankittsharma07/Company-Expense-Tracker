import { fetchNotificationAuditLogsService } from './notification-audit.service.js';

export const fetchNotificationAuditLogs = async (req, res) => {
    try {
        const { page, limit, userId, channel, status } = req.query;

        const result = await fetchNotificationAuditLogsService(req.user.companyId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            userId,
            channel,
            status,
        });

        return res.json(result);
    } catch (error) {
        console.error('Fetch notification audit logs error:', error);
        return res.status(500).json({ message: 'Failed to fetch notification logs' });
    }
};
