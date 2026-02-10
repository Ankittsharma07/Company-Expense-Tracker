import { prisma } from "../../config/db.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
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

const resolveTargetCurrency = (expenses, displayCurrency) => {
  const normalizedDisplay = normalizeCurrencyCode(displayCurrency);
  const fallbackCurrency = normalizeCurrencyCode(expenses[0]?.baseCurrency ?? expenses[0]?.currency) || normalizedDisplay || "USD";
  const canConvertAll = normalizedDisplay
    ? normalizedDisplay === fallbackCurrency || expenses.every((expense) => canConvertExpense(expense, normalizedDisplay))
    : false;
  return {
    resolvedCurrency: canConvertAll ? normalizedDisplay : fallbackCurrency,
    targetCurrency: canConvertAll ? normalizedDisplay : undefined,
  };
};

// Fetch expenses based on date range and user role
const fetchExpensesForReport = async ({ companyId, user, startDate, endDate }) => {
  const where = {
    companyId,
    expenseDate: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  };

  // Role-based filtering
  if (user.role === "EMPLOYEE") {
    where.userId = user.id;
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { expenseDate: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return expenses;
};

// Calculate summary statistics
const calculateSummary = (expenses, targetCurrency) => {
  const totals = {
    total: 0,
    approved: 0,
    pending: 0,
    categoryTotals: {},
  };

  expenses.forEach((expense) => {
    const amountInfo = getExpenseAmountInCurrency(expense, targetCurrency);
    const amount = Number(amountInfo.amount || 0);
    totals.total += amount;

    if (expense.status === "APPROVED" || expense.status === "ADMIN_APPROVED") {
      totals.approved += amount;
    } else if (expense.status === "PENDING" || expense.status === "MANAGER_APPROVED") {
      totals.pending += amount;
    }

    totals.categoryTotals[expense.category] = (totals.categoryTotals[expense.category] || 0) + amount;
  });

  return totals;
};

// Excel Export Service
export const exportExcelService = async ({ companyId, user, startDate, endDate, displayCurrency }) => {
  const expenses = await fetchExpensesForReport({ companyId, user, startDate, endDate });
  const { resolvedCurrency, targetCurrency } = resolveTargetCurrency(expenses, displayCurrency);
  const summary = calculateSummary(expenses, targetCurrency);
  const currencyLabel = resolvedCurrency || "USD";

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Expenses");

  // Add title
  worksheet.mergeCells("A1:G1");
  worksheet.getCell("A1").value = `Expense Report (${startDate} to ${endDate})`;
  worksheet.getCell("A1").font = { size: 16, bold: true };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  // Add headers
  worksheet.addRow([]);
  const headerRow = worksheet.addRow([
    "Date",
    "Description",
    "Category",
    `Amount (${currencyLabel})`,
    "Status",
    "Submitted By",
    "Approved By",
  ]);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data rows
  expenses.forEach((expense) => {
    const amountInfo = getExpenseAmountInCurrency(expense, targetCurrency);
    worksheet.addRow([
      expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : "â€”",
      expense.description,
      expense.category,
      Number(amountInfo.amount),
      expense.status,
      expense.user?.name || "â€”",
      expense.approvedBy || "â€”",
    ]);
  });

  // Add summary section
  worksheet.addRow([]);
  worksheet.addRow(["Summary"]).font = { bold: true, size: 14 };
  worksheet.addRow(["Total Expenses", summary.total]);
  worksheet.addRow(["Approved Amount", summary.approved]);
  worksheet.addRow(["Pending Amount", summary.pending]);
  worksheet.addRow([]);
  worksheet.addRow(["Category Breakdown"]).font = { bold: true };
  Object.entries(summary.categoryTotals).forEach(([category, total]) => {
    worksheet.addRow([category, total]);
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    column.width = 15;
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// PDF Export Service
export const exportPDFService = async ({ companyId, user, startDate, endDate, displayCurrency }) => {
  const expenses = await fetchExpensesForReport({ companyId, user, startDate, endDate });
  const { resolvedCurrency, targetCurrency } = resolveTargetCurrency(expenses, displayCurrency);
  const summary = calculateSummary(expenses, targetCurrency);
  const currencyLabel = resolvedCurrency || "USD";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title
    doc.fontSize(20).text(`Expense Report`, { align: "center" });
    doc.fontSize(12).text(`${startDate} to ${endDate}`, { align: "center" });
    doc.moveDown();

    // Summary
    doc.fontSize(14).text("Summary", { underline: true });
    doc.fontSize(10);
    doc.text(`Total Expenses: ${currencyLabel} ${summary.total.toFixed(2)}`);
    doc.text(`Approved Amount: ${currencyLabel} ${summary.approved.toFixed(2)}`);
    doc.text(`Pending Amount: ${currencyLabel} ${summary.pending.toFixed(2)}`);
    doc.moveDown();

    // Category Breakdown
    doc.fontSize(12).text("Category Breakdown", { underline: true });
    doc.fontSize(10);
    Object.entries(summary.categoryTotals).forEach(([category, total]) => {
      doc.text(`${category}: ${currencyLabel} ${Number(total).toFixed(2)}`);
    });
    doc.moveDown();

    // Expenses Table
    doc.fontSize(12).text("Expense Details", { underline: true });
    doc.fontSize(8);

    expenses.forEach((expense, index) => {
      if (index > 0 && index % 20 === 0) {
        doc.addPage();
      }
      const amountInfo = getExpenseAmountInCurrency(expense, targetCurrency);
      doc.text(
        `${expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : "â€”"} | ${expense.description} | ${expense.category} | ${currencyLabel} ${Number(amountInfo.amount).toFixed(2)} | ${expense.status}`
      );
    });

    doc.end();
  });
};
