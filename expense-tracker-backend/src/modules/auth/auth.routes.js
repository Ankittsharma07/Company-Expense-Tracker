import { Router } from "express";
import { signup, login, googleLogin, forgotPassword, resetPassword } from "./auth.controller.js";
import { authRateLimiter } from "../../middleware/rateLimit.js";

export const authRoutes = Router();

authRoutes.post("/signup", authRateLimiter, signup);
authRoutes.post("/login", authRateLimiter, login);
authRoutes.post("/google", authRateLimiter, googleLogin);
authRoutes.post("/forgot-password", authRateLimiter, forgotPassword);
authRoutes.post("/reset-password", authRateLimiter, resetPassword);
