import { prisma } from "../../config/db.js";

export const createExpenseService = async (companyId, userId, data) => {
  return prisma.expense.create({
    data: {
      companyId,
      userId,
      description: data.description,
      category: data.category,
      amount: data.amount,
      currency: data.currency || "USD",
      receiptUrl: data.receiptUrl || null,
      receiptPublicId: data.receiptPublicId || null,
      receiptType: data.receiptType || null,
      uploadedAt: data.uploadedAt || null,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
    },
  });
};

export const listExpensesService = async ({ companyId, user, filters }) => {
  const where = {
    companyId,
    ...(user.role === "EMPLOYEE" ? { userId: user.id } : {}),
  };

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.userId && user.role !== "EMPLOYEE") {
    where.userId = filters.userId;
  }
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = new Date(filters.from);
    }
    if (filters.to) {
      where.createdAt.lte = new Date(filters.to);
    }
  }

  return prisma.expense.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getExpenseService = async ({ companyId, user, expenseId }) => {
  const where = {
    id: expenseId,
    companyId,
    ...(user.role === "EMPLOYEE" ? { userId: user.id } : {}),
  };

  return prisma.expense.findFirst({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvals: true,
    },
  });
};

export const getExpenseByIdService = async ({ companyId, expenseId }) => {
  return prisma.expense.findFirst({
    where: { id: expenseId, companyId },
  });
};

export const updateExpenseService = async ({ companyId, userId, expenseId, data }) => {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, companyId, userId },
  });

  if (!expense) {
    throw new Error("Expense not found");
  }
  if (expense.status !== "PENDING_MANAGER" && expense.status !== "PENDING") {
    throw new Error("Only pending manager expenses can be updated");
  }

  return prisma.expense.update({
    where: { id: expenseId },
    data: {
      description: data.description ?? expense.description,
      category: data.category ?? expense.category,
      amount: data.amount ?? expense.amount,
      currency: data.currency ?? expense.currency,
      receiptUrl: data.receiptUrl !== undefined ? data.receiptUrl : expense.receiptUrl,
      receiptPublicId: data.receiptPublicId !== undefined ? data.receiptPublicId : expense.receiptPublicId,
      receiptType: data.receiptType !== undefined ? data.receiptType : expense.receiptType,
      uploadedAt: data.uploadedAt !== undefined ? data.uploadedAt : expense.uploadedAt,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : expense.expenseDate,
    },
  });
};

export const deleteExpenseService = async ({ companyId, userId, expenseId }) => {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, companyId, userId },
  });

  if (!expense) {
    throw new Error("Expense not found");
  }
  if (expense.status !== "PENDING_MANAGER" && expense.status !== "PENDING") {
    throw new Error("Only pending manager expenses can be deleted");
  }

  await prisma.approval.deleteMany({ where: { expenseId } });
  await prisma.expense.delete({ where: { id: expenseId } });

  return { id: expenseId };
};
