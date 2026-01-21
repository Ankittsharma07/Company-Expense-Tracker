import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";

export const getSubscriptionService = async (companyId) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, plan: true },
  });

  const employeeCount = await prisma.user.count({
    where: { companyId, role: { in: ["MANAGER", "EMPLOYEE"] } },
  });

  return {
    company,
    employeeCount,
    limits: {
      freePlanEmployeeLimit: env.freePlanEmployeeLimit,
    },
  };
};

export const upgradeToProService = async (companyId) => {
  return prisma.company.update({
    where: { id: companyId },
    data: { plan: "PRO" },
    select: { id: true, name: true, plan: true },
  });
};
