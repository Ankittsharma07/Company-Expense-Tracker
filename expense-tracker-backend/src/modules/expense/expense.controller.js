import { z } from "zod";
import {
  createExpenseService,
  listExpensesService,
  getExpenseService,
  updateExpenseService,
  deleteExpenseService,
} from "./expense.service.js";

const createExpenseSchema = z.object({
  description: z.string().min(3),
  category: z.string().min(2),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).optional(),
  receiptUrl: z.string().url().optional(),
  expenseDate: z.string().datetime().optional(),
});

const updateExpenseSchema = z.object({
  description: z.string().min(3).optional(),
  category: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  receiptUrl: z.string().url().optional().nullable(),
  expenseDate: z.string().datetime().optional(),
});

export const createExpense = async (req, res) => {
  try {
    const payload = createExpenseSchema.parse(req.body);
    const expense = await createExpenseService(req.user.companyId, req.user.id, payload);
    return res.status(201).json(expense);
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
    const payload = updateExpenseSchema.parse(req.body);
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
