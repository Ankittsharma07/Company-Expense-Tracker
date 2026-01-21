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
      createdAt: true,
    },
  });
};
