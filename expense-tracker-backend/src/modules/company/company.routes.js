import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getCompany, updatePlan } from "./company.controller.js";

export const companyRoutes = Router();

companyRoutes.get("/me", authMiddleware, getCompany);
companyRoutes.patch("/plan", authMiddleware, requireRole("ADMIN"), updatePlan);
