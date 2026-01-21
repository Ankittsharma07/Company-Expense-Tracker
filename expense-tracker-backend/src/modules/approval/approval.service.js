import { prisma } from "../../config/db.js";

const buildApproval = ({ companyId, expenseId, approvedById, decision, level, comment }) => {
  return prisma.approval.create({
    data: {
      companyId,
      expenseId,
      approvedById,
      status: decision === "approve" ? "APPROVED" : "REJECTED",
      level,
      comment: comment || null,
    },
  });
};

export const managerApproveService = async ({ companyId, expenseId, approvedById, decision, comment }) => {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, companyId },
  });

  if (!expense) {
    throw new Error("Expense not found");
  }

  if (expense.status !== "PENDING") {
    throw new Error("Only pending expenses can be manager-approved");
  }

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      status: decision === "approve" ? "MANAGER_APPROVED" : "REJECTED",
    },
  });

  await buildApproval({
    companyId,
    expenseId,
    approvedById,
    decision,
    level: "MANAGER",
    comment,
  });

  return updated;
};

export const adminApproveService = async ({ companyId, expenseId, approvedById, decision, comment }) => {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, companyId },
  });

  if (!expense) {
    throw new Error("Expense not found");
  }

  if (!["PENDING", "MANAGER_APPROVED"].includes(expense.status)) {
    throw new Error("Expense cannot be admin-approved in current status");
  }

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      status: decision === "approve" ? "ADMIN_APPROVED" : "REJECTED",
    },
  });

  await buildApproval({
    companyId,
    expenseId,
    approvedById,
    decision,
    level: "ADMIN",
    comment,
  });

  return updated;
};
