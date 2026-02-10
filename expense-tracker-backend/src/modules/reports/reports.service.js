import { prisma } from "../../config/db.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { getConversionRate, getExpenseAmountInCurrency } from "../../services/currency/currency.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FONT_DIR = path.resolve(__dirname, "../../../assets/fonts");
const FONT_REGULAR_PATH = path.join(FONT_DIR, "NotoSans-Variable.ttf");
const FONT_BOLD_PATH = FONT_REGULAR_PATH;

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
  const fallbackCurrency =
    normalizeCurrencyCode(expenses[0]?.baseCurrency ?? expenses[0]?.currency) ||
    normalizedDisplay ||
    "USD";
  const canConvertAll = normalizedDisplay
    ? normalizedDisplay === fallbackCurrency ||
      expenses.every((expense) => canConvertExpense(expense, normalizedDisplay))
    : false;
  return {
    resolvedCurrency: canConvertAll ? normalizedDisplay : fallbackCurrency,
    targetCurrency: canConvertAll ? normalizedDisplay : undefined,
  };
};

const formatCurrencyValue = (amount, currency) => {
  const numeric = Number(amount || 0);
  const code = normalizeCurrencyCode(currency) || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${code} ${numeric.toFixed(2)}`;
  }
};

const formatDateValue = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const buildCategoryBreakdown = (categoryTotals, maxItems = 6) => {
  const entries = Object.entries(categoryTotals || {})
    .map(([category, total]) => [category, Number(total) || 0])
    .sort((a, b) => b[1] - a[1]);

  if (entries.length <= maxItems) return entries;

  const top = entries.slice(0, maxItems - 1);
  const otherTotal = entries.slice(maxItems - 1).reduce((sum, entry) => sum + entry[1], 0);
  return [...top, ["Other", otherTotal]];
};

const getPdfFonts = (doc) => {
  try {
    doc.registerFont("ReportRegular", FONT_REGULAR_PATH);
    doc.registerFont("ReportBold", FONT_BOLD_PATH);
    return { regular: "ReportRegular", bold: "ReportBold" };
  } catch (error) {
    console.warn("[Reports] Failed to load custom PDF fonts, falling back to Helvetica.", error.message);
    return { regular: "Helvetica", bold: "Helvetica-Bold" };
  }
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

  if (user.role === "EMPLOYEE") {
    where.userId = user.id;
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { expenseDate: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvals: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { approvedBy: { select: { name: true } } },
      },
    },
  });

  return expenses;
};

const fetchCompanyName = async (companyId) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });
    return company?.name || "";
  } catch {
    return "";
  }
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

    totals.categoryTotals[expense.category] =
      (totals.categoryTotals[expense.category] || 0) + amount;
  });

  return totals;
};

// Excel Export Service
export const exportExcelService = async ({ companyId, user, startDate, endDate, displayCurrency }) => {
  const [expenses, companyName] = await Promise.all([
    fetchExpensesForReport({ companyId, user, startDate, endDate }),
    fetchCompanyName(companyId),
  ]);

  const { resolvedCurrency, targetCurrency } = resolveTargetCurrency(expenses, displayCurrency);
  const summary = calculateSummary(expenses, targetCurrency);
  const currencyLabel = resolvedCurrency || "USD";
  const categoryBreakdown = buildCategoryBreakdown(summary.categoryTotals);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DualSpend";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Expenses", {
    views: [{ state: "frozen", ySplit: 9 }],
  });

  worksheet.columns = [
    { width: 14 },
    { width: 40 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
    { width: 20 },
    { width: 20 },
  ];

  const title = companyName ? `${companyName} - Expense Report` : "Expense Report";
  worksheet.mergeCells("A1:G1");
  worksheet.getCell("A1").value = title;
  worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F766E" },
  };
  worksheet.getRow(1).height = 28;

  worksheet.mergeCells("A2:G2");
  worksheet.getCell("A2").value = `Period: ${startDate} to ${endDate}`;
  worksheet.getCell("A2").font = { size: 11, color: { argb: "FF334155" } };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.addRow([]);
  worksheet.mergeCells("A4:G4");
  worksheet.getCell("A4").value = "Summary";
  worksheet.getCell("A4").font = { size: 12, bold: true, color: { argb: "FF0F172A" } };
  worksheet.getCell("A4").alignment = { horizontal: "left" };
  worksheet.getCell("A4").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  worksheet.getCell("A5").value = "Total Expenses";
  worksheet.getCell("B5").value = summary.total;
  worksheet.getCell("A6").value = "Approved Amount";
  worksheet.getCell("B6").value = summary.approved;
  worksheet.getCell("A7").value = "Pending Amount";
  worksheet.getCell("B7").value = summary.pending;
  worksheet.getCell("B5").numFmt = "#,##0.00";
  worksheet.getCell("B6").numFmt = "#,##0.00";
  worksheet.getCell("B7").numFmt = "#,##0.00";

  worksheet.getRow(8).height = 6;

  const headerRowIndex = 9;
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.values = [
    "Date",
    "Description",
    "Category",
    `Amount (${currencyLabel})`,
    "Status",
    "Submitted By",
    "Approved By",
  ];
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 20;
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber <= 7) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1D4ED8" },
      };
    }
  });

  const dataStart = headerRowIndex + 1;
  const descWidth = worksheet.getColumn(2).width || 40;
  const categoryWidth = worksheet.getColumn(3).width || 18;
  const statusWidth = worksheet.getColumn(5).width || 16;
  const submittedWidth = worksheet.getColumn(6).width || 20;
  const approvedWidth = worksheet.getColumn(7).width || 20;

  const estimateLines = (text, width) => {
    if (!text) return 1;
    const clean = String(text);
    const columnWidth = Math.max(1, Number(width) || 10);
    return Math.max(1, Math.ceil(clean.length / columnWidth));
  };

  expenses.forEach((expense, index) => {
    const amountInfo = getExpenseAmountInCurrency(expense, targetCurrency);
    const approvedByName = expense.approvals?.[0]?.approvedBy?.name || "-";
    const rowValues = [
      formatDateValue(expense.expenseDate),
      expense.description,
      expense.category,
      Number(amountInfo.amount),
      expense.status,
      expense.user?.name || "-",
      approvedByName,
    ];
    const row = worksheet.getRow(dataStart + index);
    row.values = rowValues;
    row.getCell(4).numFmt = "#,##0.00";
    const maxLines = Math.max(
      estimateLines(rowValues[1], descWidth),
      estimateLines(rowValues[2], categoryWidth),
      estimateLines(rowValues[4], statusWidth),
      estimateLines(rowValues[5], submittedWidth),
      estimateLines(rowValues[6], approvedWidth)
    );
    row.height = Math.min(60, 16 * maxLines);

    if (index % 2 === 0) {
      for (let col = 1; col <= 7; col += 1) {
        row.getCell(col).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }
    }
  });

  const lastDataRow = dataStart + expenses.length - 1;
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber >= headerRowIndex && rowNumber <= lastDataRow) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    }
  });

  const breakdownStart = lastDataRow + 2;
  worksheet.mergeCells(`A${breakdownStart}:C${breakdownStart}`);
  worksheet.getCell(`A${breakdownStart}`).value = "Category Breakdown";
  worksheet.getCell(`A${breakdownStart}`).font = { bold: true, color: { argb: "FF0F172A" } };
  worksheet.getCell(`A${breakdownStart}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  const breakdownHeaderRow = worksheet.getRow(breakdownStart + 1);
  breakdownHeaderRow.values = ["Category", `Amount (${currencyLabel})`];
  breakdownHeaderRow.font = { bold: true };
  breakdownHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" },
  };

  categoryBreakdown.forEach(([category, total], idx) => {
    const row = worksheet.getRow(breakdownStart + 2 + idx);
    row.values = [category, Number(total)];
    row.getCell(2).numFmt = "#,##0.00";
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// PDF Export Service
export const exportPDFService = async ({ companyId, user, startDate, endDate, displayCurrency }) => {
  const [expenses, companyName] = await Promise.all([
    fetchExpensesForReport({ companyId, user, startDate, endDate }),
    fetchCompanyName(companyId),
  ]);

  const { resolvedCurrency, targetCurrency } = resolveTargetCurrency(expenses, displayCurrency);
  const summary = calculateSummary(expenses, targetCurrency);
  const currencyLabel = resolvedCurrency || "USD";
  const categoryBreakdown = buildCategoryBreakdown(summary.categoryTotals);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks = [];
    const fonts = getPdfFonts(doc);

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const headerHeight = 60;
    const headerX = doc.page.margins.left;
    const headerY = doc.page.margins.top;

    doc
      .rect(headerX, headerY, pageWidth, headerHeight)
      .fill("#0f766e");

    doc
      .fillColor("#ffffff")
      .fontSize(20)
      .font(fonts.bold)
      .text(companyName ? `${companyName} Expense Report` : "Expense Report", headerX + 16, headerY + 14, {
        width: pageWidth - 32,
      });

    doc
      .fontSize(10)
      .font(fonts.regular)
      .text(`Period: ${startDate} to ${endDate}`, headerX + 16, headerY + 38, {
        width: pageWidth - 32,
      });

    let cursorY = headerY + headerHeight + 20;

    const cardGap = 12;
    const cardWidth = (pageWidth - cardGap * 2) / 3;
    const cardHeight = 60;

    const drawSummaryCard = (x, label, value) => {
      doc
        .rect(x, cursorY, cardWidth, cardHeight)
        .fill("#f1f5f9");
      doc
        .fillColor("#475569")
        .fontSize(9)
        .font(fonts.regular)
        .text(label, x + 12, cursorY + 10, { width: cardWidth - 24 });
      doc
        .fillColor("#0f172a")
        .fontSize(14)
        .font(fonts.bold)
        .text(value, x + 12, cursorY + 28, { width: cardWidth - 24 });
    };

    drawSummaryCard(headerX, "Total Expenses", formatCurrencyValue(summary.total, currencyLabel));
    drawSummaryCard(headerX + cardWidth + cardGap, "Approved", formatCurrencyValue(summary.approved, currencyLabel));
    drawSummaryCard(headerX + (cardWidth + cardGap) * 2, "Pending", formatCurrencyValue(summary.pending, currencyLabel));

    cursorY += cardHeight + 18;

    doc
      .fillColor("#0f172a")
      .fontSize(12)
      .font(fonts.bold)
      .text("Category Breakdown", headerX, cursorY);

    cursorY += 14;

    doc.fontSize(9).font(fonts.regular);
    categoryBreakdown.forEach(([category, total]) => {
      doc
        .fillColor("#475569")
        .text(`${category}`, headerX, cursorY, { width: pageWidth * 0.6 });
      doc
        .fillColor("#0f172a")
        .text(formatCurrencyValue(total, currencyLabel), headerX + pageWidth * 0.65, cursorY, {
          width: pageWidth * 0.35,
          align: "right",
        });
      cursorY += 12;
    });

    cursorY += 26;

    const tableColumns = [
      { key: "date", label: "Date", width: 70 },
      { key: "description", label: "Description", width: 160 },
      { key: "category", label: "Category", width: 80 },
      { key: "amount", label: `Amount (${currencyLabel})`, width: 90, align: "right" },
      { key: "status", label: "Status", width: 70 },
      { key: "submitted", label: "Submitted", width: 80 },
    ];

    const totalWidth = tableColumns.reduce((sum, col) => sum + col.width, 0);
    const scale = pageWidth / totalWidth;
    tableColumns.forEach((col) => {
      col.width = Math.floor(col.width * scale);
    });

    const drawTableHeader = () => {
      doc
        .rect(headerX, cursorY, pageWidth, 18)
        .fill("#1d4ed8");
      let x = headerX;
      doc.fillColor("#ffffff").fontSize(9).font(fonts.bold);
      tableColumns.forEach((col) => {
        doc.text(col.label, x + 4, cursorY + 5, { width: col.width - 8, align: col.align || "left" });
        x += col.width;
      });
      cursorY += 20;
    };

    const truncateText = (text, maxWidth) => {
      if (!text) return "";
      const cleaned = String(text);
      if (doc.widthOfString(cleaned) <= maxWidth) return cleaned;
      let truncated = cleaned;
      while (truncated.length > 0 && doc.widthOfString(`${truncated}...`) > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      return truncated ? `${truncated}...` : "";
    };

    const drawRow = (expense, isAlt) => {
      const rowHeight = 18;
      if (cursorY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        cursorY = doc.page.margins.top;
        drawTableHeader();
      }

      if (isAlt) {
        doc.rect(headerX, cursorY, pageWidth, rowHeight).fill("#f8fafc");
      }

      const amountInfo = getExpenseAmountInCurrency(expense, targetCurrency);
      const values = {
        date: formatDateValue(expense.expenseDate),
        description: expense.description || "-",
        category: expense.category || "-",
        amount: formatCurrencyValue(amountInfo.amount, currencyLabel),
        status: expense.status || "-",
        submitted: expense.user?.name || "-",
      };

      let x = headerX;
      doc.fillColor("#0f172a").fontSize(8).font(fonts.regular);
      tableColumns.forEach((col) => {
        const value = truncateText(values[col.key], col.width - 8);
        doc.text(value, x + 4, cursorY + 5, {
          width: col.width - 8,
          align: col.align || "left",
        });
        x += col.width;
      });

      cursorY += rowHeight;
    };

    doc
      .fillColor("#0f172a")
      .fontSize(12)
      .font(fonts.bold)
      .text("Expense Details", headerX, cursorY);
    cursorY += 18;

    if (cursorY + 28 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      cursorY = doc.page.margins.top;
    }

    drawTableHeader();

    expenses.forEach((expense, idx) => {
      drawRow(expense, idx % 2 === 0);
    });

    doc.end();
  });
};
