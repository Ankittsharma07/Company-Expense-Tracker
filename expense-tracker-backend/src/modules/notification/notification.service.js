import { prisma } from "../../config/db.js";

export const listNotificationsService = async ({ userId, limit = 50 }) => {
  const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
};

export const markNotificationReadService = async ({ userId, notificationId }) => {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!existing) {
    throw new Error("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const getUnreadCountService = async ({ userId }) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { unread: count };
};
