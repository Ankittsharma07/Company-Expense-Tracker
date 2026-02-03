import { z } from "zod";
import { signupService, loginService, googleLoginService } from "./auth.service.js";

const signupSchema = z.object({
  companyName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const googleLoginSchema = z.object({
  token: z.string().min(1),
});

export const signup = async (req, res) => {
  try {
    const payload = signupSchema.parse(req.body);
    const result = await signupService(payload);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginService(payload);
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(401).json({ message: error.message || "Invalid credentials" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const payload = googleLoginSchema.parse(req.body);
    const result = await googleLoginService(payload.token);
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(401).json({ message: error.message || "Google Login failed" });
  }
};
