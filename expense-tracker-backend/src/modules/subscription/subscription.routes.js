import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getSubscription, upgradeToPro } from "./subscription.controller.js";

export const subscriptionRoutes = Router();

subscriptionRoutes.get("/", authMiddleware, requireRole("ADMIN"), getSubscription);
subscriptionRoutes.post("/upgrade", authMiddleware, requireRole("ADMIN"), upgradeToPro);
