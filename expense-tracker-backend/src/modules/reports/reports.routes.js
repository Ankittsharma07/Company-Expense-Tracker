import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { exportExcel, exportPDF } from "./reports.controller.js";

export const reportsRoutes = Router();

reportsRoutes.get("/export/excel", authMiddleware, exportExcel);
reportsRoutes.get("/export/pdf", authMiddleware, exportPDF);

