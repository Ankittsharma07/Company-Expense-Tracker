import { prisma } from "../../config/db.js";
import { hashPassword } from "../../utils/password.js";

export const createUserService = async (companyId, { name, email, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email already in use");
  }

  const passwordHash = await hashPassword(password);

  return prisma.user.create({
    data: {
      companyId,
      name,
      email,
      role,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      emailNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
      avatarUrl: true,
      googleAvatarUrl: true,
      createdAt: true,
    },
  });
};

export const listUsersService = async (companyId) => {
  return prisma.user.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      googleAvatarUrl: true,
      emailNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getMeService = async (userId, companyId) => {
  return prisma.user.findFirst({
    where: { id: userId, companyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      avatarUrl: true,
      googleAvatarUrl: true,
      emailNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
      createdAt: true,
    },
  });
};

export const updateRoleService = async (companyId, userId, role) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      avatarUrl: true,
      googleAvatarUrl: true,
      emailNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
      createdAt: true,
    },
  });
};

export const updateUserProfileService = async (companyId, userId, data) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name ?? user.name,
      email: data.email ?? user.email,
      avatarUrl: data.avatarUrl ?? user.avatarUrl,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      avatarUrl: true,
      googleAvatarUrl: true,
      emailNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
      createdAt: true,
    },
  });
};
export const updateNotificationPreferencesService = async ({ companyId, userId, data }) => {
  return prisma.user.update({
    where: { id: userId, companyId },
    data: {
      emailNotificationsEnabled: data.emailNotificationsEnabled,
      inAppNotificationsEnabled: data.inAppNotificationsEnabled,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      avatarUrl: true,
      googleAvatarUrl: true,
      emailNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
      createdAt: true,
    },
  });
};
