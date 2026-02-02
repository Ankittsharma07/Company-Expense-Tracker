import { prisma } from "../../config/db.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signToken } from "../../utils/jwt.js";

export const signupService = async ({ companyName, name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email already in use");
  }

  const company = await prisma.company.create({
    data: { name: companyName },
  });

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      name,
      email,
      role: "ADMIN",
      passwordHash,
    },
  });

  const token = signToken({ id: user.id, role: user.role, companyId: company.id });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      avatarUrl: user.avatarUrl || null,
    },
    company: {
      id: company.id,
      name: company.name,
      plan: company.plan,
    },
  };
};

export const loginService = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const token = signToken({ id: user.id, role: user.role, companyId: user.companyId });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      avatarUrl: user.avatarUrl || null,
    },
    company: {
      id: user.company.id,
      name: user.company.name,
      plan: user.company.plan,
    },
  };
};
