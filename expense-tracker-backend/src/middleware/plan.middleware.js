import { prisma } from "../config/db.js";
import { env } from "../config/env.js";

export const enforcePlanLimits = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company.plan === "FREE") {
      const employeeCount = await prisma.user.count({
        where: { companyId, role: { in: ["MANAGER", "EMPLOYEE"] } },
      });

      if (employeeCount >= env.freePlanEmployeeLimit) {
        return res.status(403).json({
          message: "Free plan employee limit reached. Upgrade to PRO.",
        });
      }
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: "Failed to enforce plan limits" });
  }
};
