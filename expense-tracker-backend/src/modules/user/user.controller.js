import { z } from "zod";
import { createUserService, listUsersService, getMeService, updateRoleService } from "./user.service.js";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["MANAGER", "EMPLOYEE"]),
});

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
});

export const createUser = async (req, res) => {
  try {
    const payload = createUserSchema.parse(req.body);
    const user = await createUserService(req.user.companyId, payload);
    return res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to create user" });
  }
};

export const listUsers = async (req, res) => {
  const users = await listUsersService(req.user.companyId);
  return res.json(users);
};

export const getMe = async (req, res) => {
  const user = await getMeService(req.user.id, req.user.companyId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json(user);
};

export const updateRole = async (req, res) => {
  try {
    const payload = updateRoleSchema.parse(req.body);
    const user = await updateRoleService(req.user.companyId, req.params.id, payload.role);
    return res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to update role" });
  }
};
