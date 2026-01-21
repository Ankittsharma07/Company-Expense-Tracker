import { prisma } from "../../config/db.js";

export const getCompanyService = async (companyId) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, plan: true, createdAt: true },
  });
  if (!company) {
    throw new Error("Company not found");
  }
  return company;
};

export const updatePlanService = async (companyId, plan) => {
  return prisma.company.update({
    where: { id: companyId },
    data: { plan },
    select: { id: true, name: true, plan: true, createdAt: true },
  });
};
