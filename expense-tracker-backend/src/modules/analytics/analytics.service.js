import { prisma } from "../../config/db.js";
import { getConversionRate, getExpenseAmountInCurrency } from "../../services/currency/currency.service.js";

const normalizeCurrencyCode = (currency) => {
  if (!currency || typeof currency !== "string") return null;
  return currency.trim().toUpperCase();
};

const canConvertExpense = (expense, targetCurrency) => {
  const display = normalizeCurrencyCode(targetCurrency);
  const originalCurrency = normalizeCurrencyCode(expense.originalCurrency ?? expense.currency);
  if (!display || !originalCurrency || !expense.exchangeRateBase || !expense.exchangeRates) return false;

  const rate = getConversionRate({
    fromCurrency: originalCurrency,
    toCurrency: display,
    exchangeRateBase: expense.exchangeRateBase,
    exchangeRates: expense.exchangeRates,
  });

  return Boolean(rate);
};

export const monthlyTotalsService = async (companyId, year, displayCurrency) => {
  try {
    // Get last 6 months from current date
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const start = new Date(Date.UTC(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1));
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));

    // Use Prisma's groupBy instead of raw SQL for better compatibility
    const expenses = await prisma.expense.findMany({
      where: {
        companyId,
        expenseDate: {
          gte: start,
          lte: end,
        },
        // Include all expenses, not just approved ones
        // status: { in: approvedStatuses },
      },
      select: {
        expenseDate: true,
        amount: true,
        currency: true,
        originalAmount: true,
        originalCurrency: true,
        baseAmount: true,
        baseCurrency: true,
        exchangeRateBase: true,
        exchangeRates: true,
      },
    });

    const normalizedDisplay = normalizeCurrencyCode(displayCurrency);
    const fallbackCurrency = normalizeCurrencyCode(expenses[0]?.baseCurrency ?? expenses[0]?.currency) || normalizedDisplay || "USD";
    const canConvertAll = normalizedDisplay
      ? normalizedDisplay === fallbackCurrency || expenses.every((expense) => canConvertExpense(expense, normalizedDisplay))
      : false;
    const resolvedCurrency = canConvertAll ? normalizedDisplay : fallbackCurrency;
    const targetCurrency = canConvertAll ? normalizedDisplay : undefined;

    // Group by month manually
    const monthlyMap = new Map();

    expenses.forEach((expense) => {
      const monthKey = new Date(expense.expenseDate).toISOString().slice(0, 7); // YYYY-MM
      const amountInfo = getExpenseAmountInCurrency(expense, targetCurrency);
      const current = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, current + Number(amountInfo.amount));
    });

    // Convert to array and sort
    const result = Array.from(monthlyMap.entries())
      .map(([month, total]) => ({
        month: `${month}-01T00:00:00.000Z`, // Format as ISO date
        total: Number(total),
        currency: resolvedCurrency,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return result;
  } catch (error) {
    console.error("Error in monthlyTotalsService:", error);
    // Return empty array instead of throwing
    return [];
  }
};

export const categoryTotalsService = async (companyId, from, to, displayCurrency) => {
  try {
    const whereClause = {
      companyId,
      // Include all expenses, not just approved ones
      // status: { in: approvedStatuses },
    };

    if (from) {
      whereClause.expenseDate = { ...whereClause.expenseDate, gte: new Date(from) };
    }
    if (to) {
      whereClause.expenseDate = { ...whereClause.expenseDate, lte: new Date(to) };
    }

    // Use Prisma's groupBy for better compatibility
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      select: {
        category: true,
        amount: true,
        currency: true,
        originalAmount: true,
        originalCurrency: true,
        baseAmount: true,
        baseCurrency: true,
        exchangeRateBase: true,
        exchangeRates: true,
      },
    });

    const normalizedDisplay = normalizeCurrencyCode(displayCurrency);
    const fallbackCurrency = normalizeCurrencyCode(expenses[0]?.baseCurrency ?? expenses[0]?.currency) || normalizedDisplay || "USD";
    const canConvertAll = normalizedDisplay
      ? normalizedDisplay === fallbackCurrency || expenses.every((expense) => canConvertExpense(expense, normalizedDisplay))
      : false;
    const resolvedCurrency = canConvertAll ? normalizedDisplay : fallbackCurrency;
    const targetCurrency = canConvertAll ? normalizedDisplay : undefined;

    // Group by category manually
    const categoryMap = new Map();

    expenses.forEach((expense) => {
      const amountInfo = getExpenseAmountInCurrency(expense, targetCurrency);
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + Number(amountInfo.amount));
    });

    // Convert to array and sort by total descending
    const result = Array.from(categoryMap.entries())
      .map(([category, total]) => ({
        category,
        total: Number(total),
        currency: resolvedCurrency,
      }))
      .sort((a, b) => b.total - a.total);

    return result;
  } catch (error) {
    console.error("Error in categoryTotalsService:", error);
    // Return empty array instead of throwing
    return [];
  }
};
