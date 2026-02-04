import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { resetUserPassword } from "./admin.controller.js";

export const adminRoutes = Router();

adminRoutes.post("/users/:userId/reset-password", authMiddleware, requireRole("ADMIN"), resetUserPassword);
