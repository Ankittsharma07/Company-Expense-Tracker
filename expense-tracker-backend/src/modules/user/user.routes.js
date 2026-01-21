import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { enforcePlanLimits } from "../../middleware/plan.middleware.js";
import { createUser, listUsers, getMe, updateRole } from "./user.controller.js";

export const userRoutes = Router();

userRoutes.get("/me", authMiddleware, getMe);
userRoutes.get("/", authMiddleware, requireRole("ADMIN"), listUsers);
userRoutes.post("/", authMiddleware, requireRole("ADMIN"), enforcePlanLimits, createUser);
userRoutes.patch("/:id/role", authMiddleware, requireRole("ADMIN"), updateRole);
