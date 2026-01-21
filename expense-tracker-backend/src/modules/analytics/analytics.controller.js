import { z } from "zod";
import { monthlyTotalsService, categoryTotalsService } from "./analytics.service.js";

const monthlySchema = z.object({
  year: z.string().optional(),
});

const categorySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const monthlyTotals = async (req, res) => {
  try {
    const payload = monthlySchema.parse(req.query);
    const result = await monthlyTotalsService(req.user.companyId, payload.year);
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to fetch analytics" });
  }
};

export const categoryTotals = async (req, res) => {
  try {
    const payload = categorySchema.parse(req.query);
    const result = await categoryTotalsService(req.user.companyId, payload.from, payload.to);
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to fetch analytics" });
  }
};
