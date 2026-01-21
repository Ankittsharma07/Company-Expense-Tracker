import { z } from "zod";
import { getCompanyService, updatePlanService } from "./company.service.js";

const planSchema = z.object({
  plan: z.enum(["FREE", "PRO"]),
});

export const getCompany = async (req, res) => {
  try {
    const company = await getCompanyService(req.user.companyId);
    return res.json(company);
  } catch (error) {
    return res.status(404).json({ message: error.message || "Company not found" });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const payload = planSchema.parse(req.body);
    const company = await updatePlanService(req.user.companyId, payload.plan);
    return res.json(company);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Plan update failed" });
  }
};
