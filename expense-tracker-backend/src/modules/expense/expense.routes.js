import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { createExpense, listExpenses, getExpense, updateExpense, deleteExpense } from "./expense.controller.js";

export const expenseRoutes = Router();

expenseRoutes.use(authMiddleware);

expenseRoutes.post("/", createExpense);
expenseRoutes.get("/", listExpenses);
expenseRoutes.get("/:id", getExpense);
expenseRoutes.patch("/:id", updateExpense);
expenseRoutes.delete("/:id", deleteExpense);
