import { prisma } from "../../config/db.js";
import { Prisma } from "@prisma/client";

const approvedStatuses = ["MANAGER_APPROVED", "ADMIN_APPROVED"];

export const monthlyTotalsService = async (companyId, year) => {
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
      },
    });

    // Group by month manually
    const monthlyMap = new Map();

    expenses.forEach((expense) => {
      const monthKey = new Date(expense.expenseDate).toISOString().slice(0, 7); // YYYY-MM
      const current = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, current + Number(expense.amount));
    });

    // Convert to array and sort
    const result = Array.from(monthlyMap.entries())
      .map(([month, total]) => ({
        month: `${month}-01T00:00:00.000Z`, // Format as ISO date
        total: Number(total),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return result;
  } catch (error) {
    console.error("Error in monthlyTotalsService:", error);
    // Return empty array instead of throwing
    return [];
  }
};

export const categoryTotalsService = async (companyId, from, to) => {
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
      },
    });

    // Group by category manually
    const categoryMap = new Map();

    expenses.forEach((expense) => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + Number(expense.amount));
    });

    // Convert to array and sort by total descending
    const result = Array.from(categoryMap.entries())
      .map(([category, total]) => ({
        category,
        total: Number(total),
      }))
      .sort((a, b) => b.total - a.total);

    return result;
  } catch (error) {
    console.error("Error in categoryTotalsService:", error);
    // Return empty array instead of throwing
    return [];
  }
};
