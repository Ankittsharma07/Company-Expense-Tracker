import { authRoutes } from "./modules/auth/auth.routes.js";
import { companyRoutes } from "./modules/company/company.routes.js";
import { userRoutes } from "./modules/user/user.routes.js";
import { expenseRoutes } from "./modules/expense/expense.routes.js";
import { approvalRoutes } from "./modules/approval/approval.routes.js";
import { analyticsRoutes } from "./modules/analytics/analytics.routes.js";
import { subscriptionRoutes } from "./modules/subscription/subscription.routes.js";
import { reportsRoutes } from "./modules/reports/reports.routes.js";
import { notificationRoutes } from "./modules/notification/notification.routes.js";
import notificationAuditRoutes from "./modules/notification-audit/notification-audit.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";

export const registerRoutes = (app) => {
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/company", companyRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/approvals", approvalRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/subscription", subscriptionRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/notification-audit", notificationAuditRoutes);
  app.use("/api/admin", adminRoutes);
};
