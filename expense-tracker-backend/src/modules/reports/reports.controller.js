import { z } from "zod";
import { exportExcelService, exportPDFService } from "./reports.service.js";

const exportSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const exportExcel = async (req, res) => {
  try {
    const payload = exportSchema.parse(req.query);
    const buffer = await exportExcelService({
      companyId: req.user.companyId,
      user: req.user,
      startDate: payload.startDate,
      endDate: payload.endDate,
    });

    const filename = `expenses_${payload.startDate}_to_${payload.endDate}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD", errors: error.errors });
    }
    console.error("Excel export error:", error);
    return res.status(500).json({ message: error.message || "Failed to export to Excel" });
  }
};

export const exportPDF = async (req, res) => {
  try {
    const payload = exportSchema.parse(req.query);
    const buffer = await exportPDFService({
      companyId: req.user.companyId,
      user: req.user,
      startDate: payload.startDate,
      endDate: payload.endDate,
    });

    const filename = `expenses_${payload.startDate}_to_${payload.endDate}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD", errors: error.errors });
    }
    console.error("PDF export error:", error);
    return res.status(500).json({ message: error.message || "Failed to export to PDF" });
  }
};

