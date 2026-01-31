import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { uploadReceipt, handleUploadError } from "../../middleware/upload.middleware.js";
import { createExpense, listExpenses, getExpense, updateExpense, deleteExpense } from "./expense.controller.js";

export const expenseRoutes = Router();

expenseRoutes.use(authMiddleware);

expenseRoutes.post("/", uploadReceipt, handleUploadError, createExpense);
expenseRoutes.get("/", listExpenses);
expenseRoutes.get("/:id", getExpense);
expenseRoutes.patch("/:id", uploadReceipt, handleUploadError, updateExpense);
expenseRoutes.delete("/:id", deleteExpense);

