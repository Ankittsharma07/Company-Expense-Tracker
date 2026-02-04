import { prisma } from '../../config/db.js';

export const fetchNotificationAuditLogsService = async (companyId, filters = {}) => {
    const { page = 1, limit = 50, userId, channel, status } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
        user: {
            companyId,
        },
    };

    if (userId) {
        where.userId = userId;
    }

    if (channel) {
        where.channel = channel;
    }

    if (status) {
        where.status = status;
    }

    const [logs, total] = await Promise.all([
        prisma.notificationAuditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limit,
        }),
        prisma.notificationAuditLog.count({ where }),
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
