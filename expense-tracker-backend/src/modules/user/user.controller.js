import { z } from "zod";
import {
  createUserService,
  listUsersService,
  getMeService,
  updateRoleService,
  updateNotificationPreferencesService,
  updateUserProfileService,
  updatePreferredCurrencyService,
} from "./user.service.js";
import { uploadAvatar as uploadAvatarToCloudinary } from "../../services/storage/avatarStorage.js";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["MANAGER", "EMPLOYEE"]),
});

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

const updatePreferencesSchema = z.object({
  emailNotificationsEnabled: z.boolean().optional(),
  inAppNotificationsEnabled: z.boolean().optional(),
});

const updateCurrencySchema = z.object({
  preferredCurrency: z.string().length(3).toUpperCase().nullable(),
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

export const updateUserProfile = async (req, res) => {
  try {
    const payload = updateUserSchema.parse(req.body);
    if (!payload.name && !payload.email) {
      return res.status(400).json({ message: "No updates provided" });
    }
    const user = await updateUserProfileService(req.user.companyId, req.params.id, payload);
    return res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to update user" });
  }
};

export const updateMyAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Avatar file is required" });
    }

    const uploadResult = await uploadAvatarToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      companyId: req.user.companyId,
      userId: req.user.id,
      originalName: req.file.originalname,
    });

    const user = await updateUserProfileService(req.user.companyId, req.user.id, {
      name: undefined,
      email: undefined,
      avatarUrl: uploadResult.url,
    });

    return res.json(user);
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to update avatar" });
  }
};

export const updateMyNotificationPreferences = async (req, res) => {
  try {
    const payload = updatePreferencesSchema.parse(req.body);
    if (payload.emailNotificationsEnabled === undefined && payload.inAppNotificationsEnabled === undefined) {
      return res.status(400).json({ message: "No preference changes provided" });
    }
    const user = await updateNotificationPreferencesService({
      companyId: req.user.companyId,
      userId: req.user.id,
      data: payload,
    });
    return res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to update preferences" });
  }
};

export const updateMyPreferredCurrency = async (req, res) => {
  try {
    const payload = updateCurrencySchema.parse(req.body);
    const user = await updatePreferredCurrencyService({
      companyId: req.user.companyId,
      userId: req.user.id,
      preferredCurrency: payload.preferredCurrency,
    });
    return res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to update currency preference" });
  }
};
