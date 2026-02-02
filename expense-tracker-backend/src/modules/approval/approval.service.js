import { prisma } from "../../config/db.js";
import { notifyAdminDecision, notifyManagerDecision } from "../../services/notifications/expenseNotifications.js";

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

  // Strict status validation: Manager can only act on PENDING_MANAGER
  if (expense.status !== "PENDING_MANAGER") {
    throw new Error("Only expenses with PENDING_MANAGER status can be acted upon by managers");
  }

  // Status transition: PENDING_MANAGER -> PENDING_ADMIN (approve) or REJECTED (reject)
  const newStatus = decision === "approve" ? "PENDING_ADMIN" : "REJECTED";

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      status: newStatus,
    },
  });

  // Create audit trail
  await buildApproval({
    companyId,
    expenseId,
    approvedById,
    decision,
    level: "MANAGER",
    comment,
  });

  try {
    await notifyManagerDecision({
      companyId,
      expense,
      decision,
      comment,
    });
  } catch (notificationError) {
    console.error("Manager approval notification failed:", notificationError.message);
  }

  return updated;
};

export const adminApproveService = async ({ companyId, expenseId, approvedById, decision, comment }) => {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, companyId },
  });

  if (!expense) {
    throw new Error("Expense not found");
  }

  // Strict status validation: Admin can only act on PENDING_ADMIN
  if (expense.status !== "PENDING_ADMIN") {
    throw new Error("Only expenses with PENDING_ADMIN status can be acted upon by admins");
  }

  // Status transition: PENDING_ADMIN -> APPROVED (approve) or REJECTED (reject)
  const newStatus = decision === "approve" ? "APPROVED" : "REJECTED";

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      status: newStatus,
    },
  });

  // Create audit trail
  await buildApproval({
    companyId,
    expenseId,
    approvedById,
    decision,
    level: "ADMIN",
    comment,
  });

  try {
    await notifyAdminDecision({
      companyId,
      expense,
      decision,
      comment,
    });
  } catch (notificationError) {
    console.error("Admin approval notification failed:", notificationError.message);
  }

  return updated;
};

// Fetch pending approvals based on user role
export const getPendingApprovalsService = async ({ companyId, userRole }) => {
  let statusFilter;

  // Role-based filtering
  if (userRole === "MANAGER") {
    // Managers see expenses with PENDING_MANAGER status
    statusFilter = "PENDING_MANAGER";
  } else if (userRole === "ADMIN") {
    // Admins see expenses with PENDING_ADMIN status
    statusFilter = "PENDING_ADMIN";
  } else {
    // Employees cannot approve anything
    return [];
  }

  const expenses = await prisma.expense.findMany({
    where: {
      companyId,
      status: statusFilter,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return expenses;
};

// Get approval counts for dashboard
export const getApprovalCountsService = async ({ companyId, userRole }) => {
  let statusFilter;

  if (userRole === "MANAGER") {
    statusFilter = "PENDING_MANAGER";
  } else if (userRole === "ADMIN") {
    statusFilter = "PENDING_ADMIN";
  } else {
    return { pending: 0 };
  }

  const count = await prisma.expense.count({
    where: {
      companyId,
      status: statusFilter,
    },
  });

  return { pending: count };
};
