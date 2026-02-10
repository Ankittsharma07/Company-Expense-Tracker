import { z } from "zod";
import {
  createExpenseService,
  listExpensesService,
  getExpenseService,
  getExpenseByIdService,
  updateExpenseService,
  deleteExpenseService,
} from "./expense.service.js";
import { uploadReceipt, deleteReceipt } from "../../services/storage/receiptStorage.js";
import { notifyExpenseSubmitted } from "../../services/notifications/expenseNotifications.js";

const entryCurrencySchema = z
  .string()
  .length(3)
  .transform((value) => value.toUpperCase())
  .refine((value) => ["USD", "INR"].includes(value), {
    message: "Currency must be USD or INR",
  });

const createExpenseSchema = z.object({
  description: z.string().min(3),
  category: z.string().min(2),
  amount: z.number().positive(),
  currency: entryCurrencySchema.optional(),
  expenseDate: z.string().datetime().optional(),
});

const updateExpenseSchema = z.object({
  description: z.string().min(3).optional(),
  category: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
  currency: entryCurrencySchema.optional(),
  expenseDate: z.string().datetime().optional(),
  removeReceipt: z.boolean().optional(),
});

export const createExpense = async (req, res) => {
  try {
    // Parse and validate body data (convert amount to number)
    const bodyData = {
      ...req.body,
      amount: req.body.amount ? Number(req.body.amount) : undefined,
    };
    const payload = createExpenseSchema.parse(bodyData);

    if (req.file && req.user.role !== "EMPLOYEE") {
      return res.status(403).json({
        message: "Only employees can upload receipts",
      });
    }

    const expense = await createExpenseService(req.user.companyId, req.user.id, payload);

    if (!req.file) {
      try {
        await notifyExpenseSubmitted({
          companyId: req.user.companyId,
          expenseId: expense.id,
        });
      } catch (notificationError) {
        console.error("Expense submitted notification failed:", notificationError.message);
      }
      return res.status(201).json(expense);
    }

    let uploadResult;
    try {
      uploadResult = await uploadReceipt({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        companyId: req.user.companyId,
        expenseId: expense.id,
        originalName: req.file.originalname,
      });

      const updatedExpense = await updateExpenseService({
        companyId: req.user.companyId,
        userId: req.user.id,
        expenseId: expense.id,
        data: {
          receiptUrl: uploadResult.url,
          receiptPublicId: uploadResult.publicId,
          receiptType: uploadResult.receiptType,
          uploadedAt: new Date(),
        },
      });

      try {
        await notifyExpenseSubmitted({
          companyId: req.user.companyId,
          expenseId: updatedExpense.id,
        });
      } catch (notificationError) {
        console.error("Expense submitted notification failed:", notificationError.message);
      }

      return res.status(201).json(updatedExpense);
    } catch (uploadError) {
      if (uploadResult?.publicId) {
        await deleteReceipt({
          publicId: uploadResult.publicId,
          receiptType: uploadResult.receiptType,
        });
      }

      try {
        await deleteExpenseService({
          companyId: req.user.companyId,
          userId: req.user.id,
          expenseId: expense.id,
        });
      } catch (cleanupError) {
        console.error("Failed to cleanup expense after upload error:", cleanupError.message);
      }

      return res.status(500).json({
        message: "File upload to Cloudinary failed",
        error: uploadError.message,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to create expense" });
  }
};

export const listExpenses = async (req, res) => {
  const filters = {
    status: req.query.status,
    category: req.query.category,
    userId: req.query.userId,
    from: req.query.from,
    to: req.query.to,
  };
  const expenses = await listExpensesService({
    companyId: req.user.companyId,
    user: req.user,
    filters,
  });
  return res.json(expenses);
};

export const getExpense = async (req, res) => {
  const expense = await getExpenseService({
    companyId: req.user.companyId,
    user: req.user,
    expenseId: req.params.id,
  });

  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  return res.json(expense);
};

export const updateExpense = async (req, res) => {
  try {
    // Parse and validate body data (convert amount to number if present)
    const bodyData = {
      ...req.body,
      amount: req.body.amount ? Number(req.body.amount) : undefined,
      removeReceipt:
        req.body.removeReceipt === true ||
        req.body.removeReceipt === "true",
    };
    const payload = updateExpenseSchema.parse(bodyData);

    if (req.file && payload.removeReceipt) {
      return res.status(400).json({
        message: "Cannot upload and remove receipt in the same request",
      });
    }

    let existingExpense;
    if (req.file || payload.removeReceipt) {
      if (req.user.role !== "EMPLOYEE") {
        return res.status(403).json({
          message: "Only employees can upload receipts",
        });
      }

      existingExpense = await getExpenseByIdService({
        companyId: req.user.companyId,
        expenseId: req.params.id,
      });

      if (!existingExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      // Only the expense owner can upload/replace receipts
      if (existingExpense.userId !== req.user.id) {
        return res.status(403).json({
          message: "Only the expense owner can upload receipts",
        });
      }

      if (payload.removeReceipt) {
        if (existingExpense.receiptPublicId) {
          await deleteReceipt({
            publicId: existingExpense.receiptPublicId,
            receiptType: existingExpense.receiptType,
          });
        }

        payload.receiptUrl = null;
        payload.receiptPublicId = null;
        payload.receiptType = null;
        payload.uploadedAt = null;
      }
    }

    if (req.file) {
      try {
        // Upload new receipt
        const uploadResult = await uploadReceipt({
          buffer: req.file.buffer,
          mimeType: req.file.mimetype,
          companyId: req.user.companyId,
          expenseId: req.params.id,
          originalName: req.file.originalname,
        });

        // Delete old receipt if it exists
        if (existingExpense.receiptPublicId) {
          await deleteReceipt({
            publicId: existingExpense.receiptPublicId,
            receiptType: existingExpense.receiptType,
          });
        }

        // Add receipt data to payload
        payload.receiptUrl = uploadResult.url;
        payload.receiptPublicId = uploadResult.publicId;
        payload.receiptType = uploadResult.receiptType;
        payload.uploadedAt = new Date();
      } catch (uploadError) {
        return res.status(500).json({
          message: "File upload to Cloudinary failed",
          error: uploadError.message,
        });
      }
    }

    const expense = await updateExpenseService({
      companyId: req.user.companyId,
      userId: req.user.id,
      expenseId: req.params.id,
      data: payload,
    });
    return res.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to update expense" });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    // Fetch expense to get receipt info for cleanup
    const expense = await getExpenseService({
      companyId: req.user.companyId,
      user: req.user,
      expenseId: req.params.id,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Only owner can delete
    if (expense.userId !== req.user.id) {
      return res.status(403).json({ message: "Only the expense owner can delete this expense" });
    }

    // Delete receipt from Cloudinary if it exists
    if (expense.receiptPublicId) {
      await deleteReceipt({
        publicId: expense.receiptPublicId,
        receiptType: expense.receiptType,
      });
    }

    // Delete expense from database
    const result = await deleteExpenseService({
      companyId: req.user.companyId,
      userId: req.user.id,
      expenseId: req.params.id,
    });

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to delete expense" });
  }
};
