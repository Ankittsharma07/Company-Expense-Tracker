import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  managerApprove,
  adminApprove,
  getPendingApprovals,
  getApprovalCounts
} from "./approval.controller.js";

export const approvalRoutes = Router();

// Get pending approvals (role-based)
approvalRoutes.get("/pending", authMiddleware, getPendingApprovals);

// Get approval counts for dashboard
approvalRoutes.get("/counts", authMiddleware, getApprovalCounts);

// Manager approval endpoint
approvalRoutes.post("/:expenseId/manager", authMiddleware, requireRole("MANAGER"), managerApprove);

// Admin approval endpoint
approvalRoutes.post("/:expenseId/admin", authMiddleware, requireRole("ADMIN"), adminApprove);
