import { prisma } from "../../config/db.js";
import { buildNotificationEmail } from "../../utils/emailTemplates.js";
import { sendNotification, sendBulkNotifications } from "./notificationSender.js";

const formatAmount = (amount) => {
  if (amount === null || amount === undefined) {
    return "0";
  }
  if (typeof amount === "string") {
    return amount;
  }
  if (typeof amount === "number") {
    return amount.toString();
  }
  if (typeof amount === "object" && typeof amount.toString === "function") {
    return amount.toString();
  }
  return String(amount);
};

const formatCurrencyAmount = (amount, currency) => {
  const value = formatAmount(amount);
  if (!currency) {
    return value;
  }
  if (currency.toUpperCase() === "INR") {
    return `\u20B9${value}`;
  }
  return `${currency} ${value}`;
};

const buildReason = (comment) => (comment ? comment : "Reason not provided");

export const notifyExpenseSubmitted = async ({ companyId, expenseId }) => {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, companyId },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  if (!expense || expense.user?.role !== "EMPLOYEE") {
    return null;
  }

  const [managers, admins] = await Promise.all([
    prisma.user.findMany({
      where: { companyId, role: "MANAGER" },
      select: { id: true },
    }),
    prisma.user.findMany({
      where: { companyId, role: "ADMIN" },
      select: { id: true },
    }),
  ]);

  const managerIds = managers
    .map((manager) => manager.id)
    .filter((managerId) => managerId !== expense.user.id);

  const adminIds = admins
    .map((admin) => admin.id)
    .filter((adminId) => adminId !== expense.user.id);

  if (managerIds.length === 0 && adminIds.length === 0) {
    return null;
  }

  const amountText = formatCurrencyAmount(expense.baseAmount ?? expense.amount, expense.baseCurrency ?? expense.currency);
  const managerTitle = "New expense submitted";
  const managerMessage = `New expense submitted by ${expense.user.name} for ${amountText}`;
  const managerEmailTemplate = {
    subject: managerTitle,
    html: buildNotificationEmail({ title: managerTitle, message: managerMessage }),
  };

  const adminTitle = "New expense submitted";
  const adminMessage = `New expense submitted by ${expense.user.name} (${amountText}) — awaiting manager review.`;
  const adminEmailTemplate = {
    subject: adminTitle,
    html: buildNotificationEmail({ title: adminTitle, message: adminMessage }),
  };

  const tasks = [];

  if (managerIds.length > 0) {
    tasks.push(
      sendBulkNotifications({
        companyId,
        userIds: managerIds,
        title: managerTitle,
        message: managerMessage,
        type: "INFO",
        emailTemplate: managerEmailTemplate,
        notificationType: "EXPENSE_SUBMITTED",
      })
    );
  }

  if (adminIds.length > 0) {
    tasks.push(
      sendBulkNotifications({
        companyId,
        userIds: adminIds,
        title: adminTitle,
        message: adminMessage,
        type: "INFO",
        emailTemplate: adminEmailTemplate,
        notificationType: "EXPENSE_SUBMITTED",
      })
    );
  }

  return Promise.allSettled(tasks);
};

export const notifyManagerDecision = async ({ companyId, expense, decision, comment }) => {
  if (!expense?.userId) {
    return null;
  }

  const isApproved = decision === "approve";
  const title = isApproved ? "Expense approved by Manager" : "Expense rejected by Manager";
  const reason = buildReason(comment);
  const message = isApproved
    ? "Your expense has been approved by Manager"
    : `Your expense was rejected by Manager (Reason: ${reason})`;
  const type = isApproved ? "SUCCESS" : "WARNING";
  const emailTemplate = {
    subject: title,
    html: buildNotificationEmail({ title, message }),
  };

  return sendNotification({
    companyId,
    toUserId: expense.userId,
    title,
    message,
    type,
    emailTemplate,
    notificationType: "MANAGER_DECISION",
  });
};

export const notifyAdminDecision = async ({ companyId, expense, decision, comment }) => {
  if (!expense?.userId) {
    return null;
  }

  const isApproved = decision === "approve";
  const reason = buildReason(comment);
  const employeeTitle = isApproved ? "Expense approved by Admin" : "Expense rejected by Admin";
  const employeeMessage = isApproved
    ? "Your expense has been approved by Admin"
    : `Your expense was rejected by Admin (Reason: ${reason})`;
  const employeeType = isApproved ? "SUCCESS" : "WARNING";
  const employeeEmailTemplate = {
    subject: employeeTitle,
    html: buildNotificationEmail({ title: employeeTitle, message: employeeMessage }),
  };

  await sendNotification({
    companyId,
    toUserId: expense.userId,
    title: employeeTitle,
    message: employeeMessage,
    type: employeeType,
    emailTemplate: employeeEmailTemplate,
    notificationType: "ADMIN_DECISION",
  });

  const managerApproval = await prisma.approval.findFirst({
    where: {
      companyId,
      expenseId: expense.id,
      level: "MANAGER",
    },
    orderBy: { createdAt: "desc" },
    select: { approvedById: true },
  });

  if (!managerApproval?.approvedById || managerApproval.approvedById === expense.userId) {
    return null;
  }

  const managerTitle = isApproved ? "Expense approved by Admin" : "Expense rejected by Admin";
  const managerMessage = isApproved
    ? `An expense you approved has been approved by Admin`
    : `An expense you approved was rejected by Admin (Reason: ${reason})`;
  const managerType = isApproved ? "SUCCESS" : "WARNING";
  const managerEmailTemplate = {
    subject: managerTitle,
    html: buildNotificationEmail({ title: managerTitle, message: managerMessage }),
  };

  return sendNotification({
    companyId,
    toUserId: managerApproval.approvedById,
    title: managerTitle,
    message: managerMessage,
    type: managerType,
    emailTemplate: managerEmailTemplate,
    notificationType: "ADMIN_DECISION",
  });
};
