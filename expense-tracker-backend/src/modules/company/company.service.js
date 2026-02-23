import { prisma } from "../../config/db.js";

export const getCompanyService = async (companyId) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, plan: true, baseCurrency: true, createdAt: true },
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
    select: { id: true, name: true, plan: true, baseCurrency: true, createdAt: true },
  });
};

export const updateCompanyNameService = async (companyId, name) => {
  return prisma.company.update({
    where: { id: companyId },
    data: { name },
    select: { id: true, name: true, plan: true, baseCurrency: true, createdAt: true },
  });
};

export const updateBaseCurrencyService = async (companyId, baseCurrency) => {
  const expenseCount = await prisma.expense.count({ where: { companyId } });
  if (expenseCount > 0) {
    throw new Error("Base currency cannot be changed after expenses exist.");
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { baseCurrency },
    select: { id: true, name: true, plan: true, baseCurrency: true, createdAt: true },
  });
};
