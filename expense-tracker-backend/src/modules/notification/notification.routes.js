import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  listNotifications,
  markNotificationRead,
  getUnreadCount,
  listNotificationAuditLogs,
} from "./notification.controller.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", authMiddleware, listNotifications);
notificationRoutes.get("/unread-count", authMiddleware, getUnreadCount);
notificationRoutes.patch("/:id/read", authMiddleware, markNotificationRead);
notificationRoutes.get("/audit", authMiddleware, requireRole("ADMIN"), listNotificationAuditLogs);
