import { Router } from "express";
import { signup, login } from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
