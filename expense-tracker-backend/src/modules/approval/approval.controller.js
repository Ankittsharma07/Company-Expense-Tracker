import { z } from "zod";
import { managerApproveService, adminApproveService } from "./approval.service.js";

const decisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});

export const managerApprove = async (req, res) => {
  try {
    const payload = decisionSchema.parse(req.body);
    const result = await managerApproveService({
      companyId: req.user.companyId,
      expenseId: req.params.expenseId,
      approvedById: req.user.id,
      decision: payload.decision,
      comment: payload.comment,
    });
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Approval failed" });
  }
};

export const adminApprove = async (req, res) => {
  try {
    const payload = decisionSchema.parse(req.body);
    const result = await adminApproveService({
      companyId: req.user.companyId,
      expenseId: req.params.expenseId,
      approvedById: req.user.id,
      decision: payload.decision,
      comment: payload.comment,
    });
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Approval failed" });
  }
};
