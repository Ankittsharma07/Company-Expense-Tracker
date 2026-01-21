import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { managerApprove, adminApprove } from "./approval.controller.js";

export const approvalRoutes = Router();

approvalRoutes.post("/:expenseId/manager", authMiddleware, requireRole("MANAGER"), managerApprove);
approvalRoutes.post("/:expenseId/admin", authMiddleware, requireRole("ADMIN"), adminApprove);
