import { prisma } from "../config/db.js";

export const getManagerCount = async (companyId) => {
  const count = await prisma.user.count({
    where: { companyId, role: "MANAGER" },
  });
  return count;
};

export const shouldSkipManagerApproval = async (companyId) => {
  const managerCount = await getManagerCount(companyId);
  return managerCount === 0;
};

export const promotePendingManagerToAdmin = async (companyId) => {
  const shouldPromote = await shouldSkipManagerApproval(companyId);
  if (!shouldPromote) {
    return 0;
  }

  const result = await prisma.expense.updateMany({
    where: {
      companyId,
      status: "PENDING_MANAGER",
    },
    data: {
      status: "PENDING_ADMIN",
    },
  });

  return result.count;
};
