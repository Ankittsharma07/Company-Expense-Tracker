import { prisma } from "../../config/db.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

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
const calculateSummary = (expenses) => {
  const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const approved = expenses
    .filter((exp) => exp.status === "APPROVED" || exp.status === "ADMIN_APPROVED")
    .reduce((sum, exp) => sum + Number(exp.amount), 0);
  const pending = expenses
    .filter((exp) => exp.status === "PENDING" || exp.status === "MANAGER_APPROVED")
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Category-wise totals
  const categoryTotals = {};
  expenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
  });

  return { total, approved, pending, categoryTotals };
};

// Excel Export Service
export const exportExcelService = async ({ companyId, user, startDate, endDate }) => {
  const expenses = await fetchExpensesForReport({ companyId, user, startDate, endDate });
  const summary = calculateSummary(expenses);

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
    "Amount",
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
    worksheet.addRow([
      expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : "—",
      expense.description,
      expense.category,
      Number(expense.amount),
      expense.status,
      expense.user?.name || "—",
      expense.approvedBy || "—",
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
export const exportPDFService = async ({ companyId, user, startDate, endDate }) => {
  const expenses = await fetchExpensesForReport({ companyId, user, startDate, endDate });
  const summary = calculateSummary(expenses);

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
    doc.text(`Total Expenses: $${summary.total.toFixed(2)}`);
    doc.text(`Approved Amount: $${summary.approved.toFixed(2)}`);
    doc.text(`Pending Amount: $${summary.pending.toFixed(2)}`);
    doc.moveDown();

    // Category Breakdown
    doc.fontSize(12).text("Category Breakdown", { underline: true });
    doc.fontSize(10);
    Object.entries(summary.categoryTotals).forEach(([category, total]) => {
      doc.text(`${category}: $${total.toFixed(2)}`);
    });
    doc.moveDown();

    // Expenses Table
    doc.fontSize(12).text("Expense Details", { underline: true });
    doc.fontSize(8);
    
    expenses.forEach((expense, index) => {
      if (index > 0 && index % 20 === 0) {
        doc.addPage();
      }
      doc.text(
        `${expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : "—"} | ${expense.description} | ${expense.category} | $${Number(expense.amount).toFixed(2)} | ${expense.status}`
      );
    });

    doc.end();
  });
};

