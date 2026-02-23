import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getCompany, updatePlan, updateBaseCurrency, updateCompanyName, getCurrencies, getExchangeRate } from "./company.controller.js";

export const companyRoutes = Router();

companyRoutes.get("/me", authMiddleware, getCompany);
companyRoutes.patch("/plan", authMiddleware, requireRole("ADMIN"), updatePlan);
companyRoutes.patch("/currency", authMiddleware, requireRole("ADMIN"), updateBaseCurrency);
companyRoutes.patch("/name", authMiddleware, requireRole("ADMIN"), updateCompanyName);
companyRoutes.get("/currencies", authMiddleware, getCurrencies);
companyRoutes.get("/rate", authMiddleware, getExchangeRate);
