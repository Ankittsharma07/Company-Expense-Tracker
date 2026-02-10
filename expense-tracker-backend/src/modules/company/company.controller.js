import { z } from "zod";
import { getCompanyService, updatePlanService, updateBaseCurrencyService } from "./company.service.js";
import { getSupportedCurrencies, getExchangeRateWithMetadata } from "../../services/currency/currency.service.js";

const planSchema = z.object({
  plan: z.enum(["FREE", "PRO"]),
});

const currencySchema = z.object({
  baseCurrency: z.string().length(3).toUpperCase(),
});

const rateQuerySchema = z.object({
  from: z.string().length(3).toUpperCase(),
  to: z.string().length(3).toUpperCase(),
});

export const getCompany = async (req, res) => {
  try {
    const company = await getCompanyService(req.user.companyId);
    return res.json(company);
  } catch (error) {
    return res.status(404).json({ message: error.message || "Company not found" });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const payload = planSchema.parse(req.body);
    const company = await updatePlanService(req.user.companyId, payload.plan);
    return res.json(company);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Plan update failed" });
  }
};

export const updateBaseCurrency = async (req, res) => {
  try {
    const payload = currencySchema.parse(req.body);
    const company = await updateBaseCurrencyService(req.user.companyId, payload.baseCurrency);
    return res.json(company);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Currency update failed" });
  }
};

export const getCurrencies = async (req, res) => {
  try {
    const currencies = getSupportedCurrencies();
    return res.json(currencies);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch currencies" });
  }
};

export const getExchangeRate = async (req, res) => {
  try {
    const payload = rateQuerySchema.parse({
      from: req.query.from,
      to: req.query.to,
    });

    const rateData = await getExchangeRateWithMetadata(payload.from, payload.to);

    return res.json({
      from: payload.from,
      to: payload.to,
      rate: rateData.rate,
      provider: rateData.provider,
      timestamp: rateData.timestamp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Failed to fetch exchange rate" });
  }
};
