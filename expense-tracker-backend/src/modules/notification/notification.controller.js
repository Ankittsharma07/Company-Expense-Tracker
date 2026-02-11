import { z } from "zod";
import {
  listNotificationsService,
  markNotificationReadService,
  getUnreadCountService,
  listNotificationAuditLogsService,
} from "./notification.service.js";

const listSchema = z.object({
  limit: z.string().optional(),
});

const auditListSchema = z.object({
  limit: z.string().optional(),
});

export const listNotifications = async (req, res) => {
  try {
    const payload = listSchema.parse(req.query);
    const notifications = await listNotificationsService({
      userId: req.user.id,
      limit: payload.limit,
    });
    return res.json(notifications);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await markNotificationReadService({
      userId: req.user.id,
      notificationId: req.params.id,
    });
    return res.json(notification);
  } catch (error) {
    return res.status(404).json({ message: error.message || "Notification not found" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await getUnreadCountService({
      userId: req.user.id,
    });
    return res.json(count);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

export const listNotificationAuditLogs = async (req, res) => {
  try {
    const payload = auditListSchema.parse(req.query);
    const logs = await listNotificationAuditLogsService({
      companyId: req.user.companyId,
      limit: payload.limit,
    });
    return res.json(logs);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};
