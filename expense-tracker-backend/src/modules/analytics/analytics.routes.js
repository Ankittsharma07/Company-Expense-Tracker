import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { monthlyTotals, categoryTotals } from "./analytics.controller.js";

export const analyticsRoutes = Router();

analyticsRoutes.get("/monthly", authMiddleware, monthlyTotals);
analyticsRoutes.get("/categories", authMiddleware, categoryTotals);
