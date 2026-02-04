import { Router } from "express";
import { signup, login, googleLogin, forgotPassword, resetPassword } from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/google", googleLogin);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password", resetPassword);
