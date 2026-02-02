import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  listNotifications,
  markNotificationRead,
  getUnreadCount,
} from "./notification.controller.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", authMiddleware, listNotifications);
notificationRoutes.get("/unread-count", authMiddleware, getUnreadCount);
notificationRoutes.patch("/:id/read", authMiddleware, markNotificationRead);
