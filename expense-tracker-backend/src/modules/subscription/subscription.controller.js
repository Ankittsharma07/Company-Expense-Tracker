import { getSubscriptionService, upgradeToProService } from "./subscription.service.js";

export const getSubscription = async (req, res) => {
  const subscription = await getSubscriptionService(req.user.companyId);
  return res.json(subscription);
};

export const upgradeToPro = async (req, res) => {
  const company = await upgradeToProService(req.user.companyId);
  return res.json(company);
};
