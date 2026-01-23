import { z } from "zod";
import {
  managerApproveService,
  adminApproveService,
  getPendingApprovalsService,
  getApprovalCountsService
} from "./approval.service.js";

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

// Get pending approvals for current user's role
export const getPendingApprovals = async (req, res) => {
  try {
    const expenses = await getPendingApprovalsService({
      companyId: req.user.companyId,
      userRole: req.user.role,
    });
    return res.json(expenses);
  } catch (error) {
    console.error("Get pending approvals error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch pending approvals" });
  }
};

// Get approval counts for dashboard
export const getApprovalCounts = async (req, res) => {
  try {
    const counts = await getApprovalCountsService({
      companyId: req.user.companyId,
      userRole: req.user.role,
    });
    return res.json(counts);
  } catch (error) {
    console.error("Get approval counts error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch approval counts" });
  }
};
