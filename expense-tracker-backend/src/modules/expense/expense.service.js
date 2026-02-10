import { prisma } from "../../config/db.js";
import { buildExpenseCurrencyFields, convertAmount, getConversionRate } from "../../services/currency/currency.service.js";
import { shouldSkipManagerApproval, promotePendingManagerToAdmin } from "../../services/approvalFlow.js";

export const createExpenseService = async (companyId, userId, data) => {
  // Fetch company to get baseCurrency
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { baseCurrency: true },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  let currencyFields;
  try {
    currencyFields = await buildExpenseCurrencyFields({
      amount: data.amount,
      currency: data.currency || company.baseCurrency,
      baseCurrency: company.baseCurrency,
    });
  } catch (error) {
    console.error("[ExpenseService] Failed to fetch exchange rate:", error);
    throw new Error(`Unable to create expense: ${error.message}. Please try again or contact support.`);
  }

  const skipManager = await shouldSkipManagerApproval(companyId);

  return prisma.expense.create({
    data: {
      companyId,
      userId,
      description: data.description,
      category: data.category,
      amount: currencyFields.originalAmount,
      currency: currencyFields.originalCurrency,
      originalAmount: currencyFields.originalAmount,
      originalCurrency: currencyFields.originalCurrency,
      exchangeRate: currencyFields.exchangeRate,
      baseAmount: currencyFields.baseAmount,
      baseCurrency: currencyFields.baseCurrency,
      exchangeRateBase: currencyFields.exchangeRateBase,
      exchangeRates: currencyFields.exchangeRates,
      exchangeRateTimestamp: currencyFields.exchangeRateTimestamp,
      rateProvider: currencyFields.rateProvider,
      rateTimestamp: currencyFields.rateTimestamp,
      receiptUrl: data.receiptUrl || null,
      receiptPublicId: data.receiptPublicId || null,
      receiptType: data.receiptType || null,
      uploadedAt: data.uploadedAt || null,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      status: skipManager ? "PENDING_ADMIN" : "PENDING_MANAGER",
    },
  });
};

export const listExpensesService = async ({ companyId, user, filters }) => {
  if (user.role === "ADMIN") {
    await promotePendingManagerToAdmin(companyId);
  }

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

  const nextAmount = data.amount ?? expense.originalAmount ?? expense.amount;
  const nextCurrency = data.currency ?? expense.originalCurrency ?? expense.currency;
  const currencyChanged = data.amount !== undefined || data.currency !== undefined;
  let currencyFields = null;

  if (currencyChanged) {
    const nextCurrencyNormalized = (nextCurrency || "").toString().toUpperCase();
    if (expense.exchangeRateBase && expense.exchangeRates) {
      const exchangeRate = getConversionRate({
        fromCurrency: nextCurrencyNormalized,
        toCurrency: expense.baseCurrency,
        exchangeRateBase: expense.exchangeRateBase,
        exchangeRates: expense.exchangeRates,
      });

      if (!exchangeRate) {
        throw new Error("Stored exchange rates do not include the requested currency conversion.");
      }

      currencyFields = {
        originalAmount: Number(nextAmount),
        originalCurrency: nextCurrencyNormalized,
        exchangeRate,
        baseAmount: convertAmount(nextAmount, exchangeRate),
        baseCurrency: expense.baseCurrency,
      };
    } else {
      const currentCurrencyNormalized = (expense.originalCurrency ?? expense.currency ?? "").toString().toUpperCase();

      if (nextCurrencyNormalized && currentCurrencyNormalized && nextCurrencyNormalized !== currentCurrencyNormalized) {
        throw new Error("Currency changes are not supported for legacy expenses without stored exchange rates.");
      }

      const legacyExchangeRate = Number(expense.exchangeRate ?? 1);
      const legacyCurrency = currentCurrencyNormalized || expense.originalCurrency || expense.currency;
      currencyFields = {
        originalAmount: Number(nextAmount),
        originalCurrency: legacyCurrency,
        exchangeRate: legacyExchangeRate,
        baseAmount: convertAmount(nextAmount, legacyExchangeRate),
        baseCurrency: expense.baseCurrency,
      };
    }
  }

  return prisma.expense.update({
    where: { id: expenseId },
    data: {
      description: data.description ?? expense.description,
      category: data.category ?? expense.category,
      amount: currencyFields ? currencyFields.originalAmount : expense.amount,
      currency: currencyFields ? currencyFields.originalCurrency : expense.currency,
      originalAmount: currencyFields ? currencyFields.originalAmount : expense.originalAmount,
      originalCurrency: currencyFields ? currencyFields.originalCurrency : expense.originalCurrency,
      exchangeRate: currencyFields ? currencyFields.exchangeRate : expense.exchangeRate,
      baseAmount: currencyFields ? currencyFields.baseAmount : expense.baseAmount,
      baseCurrency: currencyFields ? currencyFields.baseCurrency : expense.baseCurrency,
      rateProvider: currencyFields?.rateProvider ?? expense.rateProvider,
      rateTimestamp: currencyFields?.rateTimestamp ?? expense.rateTimestamp,
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
