/**
 * Currency Service - ExchangeRate-API Integration
 * Handles exchange rate fetching and stored-rate conversions
 */

import { POPULAR_CURRENCIES } from "./currency.constants.js";
import { env } from "../../config/env.js";

const EXCHANGE_RATE_API_KEY = env.exchangeRateApiKey;
const EXCHANGE_RATE_API_BASE_URL = env.exchangeRateApiBaseUrl.replace(/\/$/, "");
const EXCHANGE_RATE_PROVIDER = "ExchangeRate-API";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const ENTRY_CURRENCIES = ["USD", "INR"];
const DEFAULT_EXCHANGE_RATE_BASE = "USD";
const SUPPORTED_CURRENCY_CODES = POPULAR_CURRENCIES.map((currency) => currency.code);

// In-memory cache for exchange rates (single pair conversions only)
const rateCache = new Map();

const normalizeCurrencyCode = (currency) => {
  if (!currency || typeof currency !== "string") return null;
  return currency.trim().toUpperCase();
};

const roundToCents = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Number(numberValue.toFixed(2));
};

const normalizeRatesMap = (rates) => {
  if (!rates || typeof rates !== "object") return null;
  const normalized = {};
  Object.entries(rates).forEach(([code, value]) => {
    const normalizedCode = normalizeCurrencyCode(code);
    const numericValue = Number(value);
    if (normalizedCode && Number.isFinite(numericValue)) {
      normalized[normalizedCode] = numericValue;
    }
  });
  return Object.keys(normalized).length ? normalized : null;
};

const buildFilteredRates = ({ base, rawRates, targetCurrencies }) => {
  const targetSet = new Set(
    (Array.isArray(targetCurrencies) ? targetCurrencies : [])
      .map((currency) => normalizeCurrencyCode(currency))
      .filter(Boolean)
  );
  targetSet.add(base);

  const normalizedRates = normalizeRatesMap(rawRates);
  if (!normalizedRates) return null;

  const filteredRates = {};
  targetSet.forEach((code) => {
    if (code === base) {
      filteredRates[code] = 1;
      return;
    }
    if (normalizedRates[code]) {
      filteredRates[code] = normalizedRates[code];
    }
  });

  if (!filteredRates[base]) {
    filteredRates[base] = 1;
  }

  return filteredRates;
};

const ensureSupportedEntryCurrency = (currency) => {
  if (!ENTRY_CURRENCIES.includes(currency)) {
    throw new Error("Currency must be USD or INR");
  }
};

const buildLatestUrl = (base) => {
  return `${EXCHANGE_RATE_API_BASE_URL}/${EXCHANGE_RATE_API_KEY}/latest/${base}`;
};

const buildHistoryUrl = (base, dateValue) => {
  const year = dateValue.getUTCFullYear();
  const month = dateValue.getUTCMonth() + 1;
  const day = dateValue.getUTCDate();
  return `${EXCHANGE_RATE_API_BASE_URL}/${EXCHANGE_RATE_API_KEY}/history/${base}/${year}/${month}/${day}`;
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const fetchExchangeRateApi = async ({ url, context }) => {
  const response = await fetch(url);
  const body = await parseJsonSafely(response);

  if (!response.ok) {
    const errorText = body ? JSON.stringify(body) : await response.text();
    throw new Error(`ExchangeRate API error (${response.status}): ${errorText}`);
  }

  if (body?.result === "error") {
    const errorType = body["error-type"] || "unknown-error";
    throw new Error(`ExchangeRate API error (${errorType})`);
  }

  if (body?.result && body.result !== "success") {
    throw new Error(`Unexpected ExchangeRate API response for ${context}`);
  }

  return body;
};

const getSnapshotTimestamp = (data, fallbackDate = new Date()) => {
  if (Number.isFinite(Number(data?.time_last_update_unix))) {
    return new Date(Number(data.time_last_update_unix) * 1000);
  }
  if (data?.time_last_update_utc) {
    const parsed = new Date(data.time_last_update_utc);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return fallbackDate;
};

/**
 * Fetch exchange rate from ExchangeRate-API (single pair)
 * @param {string} fromCurrency - Source currency code (e.g., 'USD')
 * @param {string} toCurrency - Target currency code (e.g., 'EUR')
 * @returns {Promise<number>} Exchange rate
 */
export const fetchExchangeRate = async (fromCurrency, toCurrency) => {
  if (!EXCHANGE_RATE_API_KEY) {
    throw new Error("EXCHANGERATE_API_KEY is not configured");
  }

  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);

  if (!from || !to) {
    throw new Error("Invalid currency code");
  }

  if (from === to) {
    return 1.0;
  }

  const cacheKey = `${from}_${to}`;
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[CurrencyService] Using cached rate for ${cacheKey}: ${cached.rate}`);
    return cached.rate;
  }

  try {
    const url = buildLatestUrl(from);
    console.log(`[CurrencyService] Fetching exchange rate (${EXCHANGE_RATE_PROVIDER}): ${from} -> ${to}`);

    const data = await fetchExchangeRateApi({ url, context: `${from}->${to}` });
    const rate = Number(data?.conversion_rates?.[to]);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Invalid exchange rate received for ${from} -> ${to}`);
    }

    rateCache.set(cacheKey, {
      rate,
      timestamp: Date.now(),
    });

    console.log(`[CurrencyService] Fetched and cached rate: ${from} -> ${to} = ${rate}`);
    return rate;
  } catch (error) {
    console.error("[CurrencyService] Error fetching exchange rate:", error);
    throw new Error(`Failed to fetch exchange rate from ${from} to ${to}: ${error.message}`);
  }
};

/**
 * Fetch a full FX snapshot for supported currencies (single API call)
 * @param {string} baseCurrency
 * @param {string[]} targetCurrencies
 * @returns {Promise<{baseCurrency: string, rates: Record<string, number>, timestamp: Date, provider: string}>}
 */
export const fetchExchangeRatesSnapshot = async ({
  baseCurrency = DEFAULT_EXCHANGE_RATE_BASE,
  targetCurrencies = SUPPORTED_CURRENCY_CODES,
} = {}) => {
  if (!EXCHANGE_RATE_API_KEY) {
    throw new Error("EXCHANGERATE_API_KEY is not configured");
  }

  const base = normalizeCurrencyCode(baseCurrency) || DEFAULT_EXCHANGE_RATE_BASE;

  try {
    const url = buildLatestUrl(base);
    console.log(`[CurrencyService] Fetching FX snapshot (${EXCHANGE_RATE_PROVIDER}): base ${base}`);

    const data = await fetchExchangeRateApi({ url, context: `snapshot:${base}` });
    const rawRates = data?.conversion_rates || data?.rates;
    const filteredRates = buildFilteredRates({
      base,
      rawRates,
      targetCurrencies,
    });

    if (!filteredRates) {
      throw new Error("Invalid exchange rate snapshot received from ExchangeRate API");
    }

    return {
      baseCurrency: base,
      rates: filteredRates,
      timestamp: getSnapshotTimestamp(data),
      provider: EXCHANGE_RATE_PROVIDER,
    };
  } catch (error) {
    console.error("[CurrencyService] Error fetching FX snapshot:", error);
    throw new Error(`Failed to fetch exchange rates: ${error.message}`);
  }
};

/**
 * Fetch a historical FX snapshot for supported currencies (single API call)
 * @param {string|Date} date - YYYY-MM-DD or Date
 * @param {string} baseCurrency
 * @param {string[]} targetCurrencies
 * @returns {Promise<{baseCurrency: string, rates: Record<string, number>, timestamp: Date, provider: string}>}
 */
export const fetchHistoricalExchangeRatesSnapshot = async ({
  date,
  baseCurrency = DEFAULT_EXCHANGE_RATE_BASE,
  targetCurrencies = SUPPORTED_CURRENCY_CODES,
} = {}) => {
  if (!EXCHANGE_RATE_API_KEY) {
    throw new Error("EXCHANGERATE_API_KEY is not configured");
  }

  if (!date) {
    throw new Error("Historical date is required");
  }

  const base = normalizeCurrencyCode(baseCurrency) || DEFAULT_EXCHANGE_RATE_BASE;
  const dateValue = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error("Invalid historical date");
  }

  try {
    const url = buildHistoryUrl(base, dateValue);
    const dateString = dateValue.toISOString().slice(0, 10);
    console.log(
      `[CurrencyService] Fetching historical FX snapshot (${EXCHANGE_RATE_PROVIDER}): base ${base} date ${dateString}`
    );

    const data = await fetchExchangeRateApi({ url, context: `history:${base}` });
    const rawRates = data?.conversion_rates || data?.rates;
    const filteredRates = buildFilteredRates({
      base,
      rawRates,
      targetCurrencies,
    });

    if (!filteredRates) {
      throw new Error("Invalid historical exchange rate snapshot received from ExchangeRate API");
    }

    const timestamp = getSnapshotTimestamp(data, new Date(`${dateString}T00:00:00.000Z`));

    return {
      baseCurrency: base,
      rates: filteredRates,
      timestamp,
      provider: EXCHANGE_RATE_PROVIDER,
    };
  } catch (error) {
    console.error("[CurrencyService] Error fetching historical FX snapshot:", error);
    throw new Error(`Failed to fetch historical exchange rates: ${error.message}`);
  }
};

/**
 * Get exchange rate with metadata (rate, provider, timestamp)
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<{rate: number, provider: string, timestamp: Date}>}
 */
export const getExchangeRateWithMetadata = async (fromCurrency, toCurrency) => {
  const rate = await fetchExchangeRate(fromCurrency, toCurrency);

  return {
    rate,
    provider: fromCurrency === toCurrency ? "NONE" : EXCHANGE_RATE_PROVIDER,
    timestamp: new Date(),
  };
};

/**
 * Convert amount using exchange rate
 * @param {number} amount - Amount to convert
 * @param {number} rate - Exchange rate
 * @returns {number} Converted amount
 */
export const convertAmount = (amount, rate) => {
  return roundToCents(Number(amount) * Number(rate));
};

/**
 * Compute conversion rate using stored FX snapshot
 * @returns {number | null}
 */
export const getConversionRate = ({ fromCurrency, toCurrency, exchangeRateBase, exchangeRates }) => {
  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);
  const base = normalizeCurrencyCode(exchangeRateBase);
  const rates = normalizeRatesMap(exchangeRates);

  if (!from || !to || !base || !rates) return null;
  if (from === to) return 1;

  const fromRate = from === base ? 1 : rates[from];
  const toRate = to === base ? 1 : rates[to];
  if (!fromRate || !toRate) return null;

  return toRate / fromRate;
};

/**
 * Convert amount using stored FX snapshot
 * @returns {number | null}
 */
export const convertUsingStoredRates = ({ amount, fromCurrency, toCurrency, exchangeRateBase, exchangeRates }) => {
  const rate = getConversionRate({ fromCurrency, toCurrency, exchangeRateBase, exchangeRates });
  if (!rate) return null;
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return null;
  return numericAmount * rate;
};

/**
 * Get list of supported currencies
 * Popular currencies for the UI
 */
export const getSupportedCurrencies = () => {
  return POPULAR_CURRENCIES;
};

/**
 * Build expense currency fields based on company base currency and original amount/currency.
 * This centralizes currency logic for create/update flows.
 */
export const buildExpenseCurrencyFields = async ({ amount, currency, baseCurrency }) => {
  const originalAmount = Number(amount);
  const originalCurrency = normalizeCurrencyCode(currency || baseCurrency);
  const companyBaseCurrency = normalizeCurrencyCode(baseCurrency);

  if (!originalCurrency || !companyBaseCurrency) {
    throw new Error("Invalid currency provided");
  }

  ensureSupportedEntryCurrency(originalCurrency);

  const snapshot = await fetchExchangeRatesSnapshot({
    baseCurrency: DEFAULT_EXCHANGE_RATE_BASE,
    targetCurrencies: SUPPORTED_CURRENCY_CODES,
  });

  const exchangeRateBase = snapshot.baseCurrency;
  const exchangeRates = snapshot.rates;
  const exchangeRateTimestamp = snapshot.timestamp;
  const exchangeRate = getConversionRate({
    fromCurrency: originalCurrency,
    toCurrency: companyBaseCurrency,
    exchangeRateBase,
    exchangeRates,
  });

  if (!exchangeRate) {
    throw new Error(`Missing exchange rate for ${originalCurrency} -> ${companyBaseCurrency}`);
  }

  const baseAmount = roundToCents(originalAmount * exchangeRate);

  return {
    originalAmount,
    originalCurrency,
    exchangeRate,
    baseAmount,
    baseCurrency: companyBaseCurrency,
    rateProvider: snapshot.provider,
    rateTimestamp: exchangeRateTimestamp,
    exchangeRateBase,
    exchangeRates,
    exchangeRateTimestamp,
  };
};

/**
 * Convert a single expense to a target currency using stored FX snapshot.
 * Falls back to baseAmount when snapshot is missing.
 */
export const getExpenseAmountInCurrency = (expense, targetCurrency) => {
  const displayCurrency = normalizeCurrencyCode(targetCurrency);
  const originalAmount = Number(expense.originalAmount ?? expense.amount ?? 0);
  const originalCurrency = normalizeCurrencyCode(expense.originalCurrency ?? expense.currency);

  if (displayCurrency && expense.exchangeRateBase && expense.exchangeRates && originalCurrency) {
    const converted = convertUsingStoredRates({
      amount: originalAmount,
      fromCurrency: originalCurrency,
      toCurrency: displayCurrency,
      exchangeRateBase: expense.exchangeRateBase,
      exchangeRates: expense.exchangeRates,
    });
    if (converted !== null) {
      return { amount: converted, currency: displayCurrency };
    }
  }

  const fallbackAmount = Number(expense.baseAmount ?? expense.amount ?? 0);
  const fallbackCurrency = normalizeCurrencyCode(expense.baseCurrency ?? expense.currency ?? displayCurrency ?? "USD");
  return { amount: fallbackAmount, currency: fallbackCurrency };
};

/**
 * Clear the rate cache (useful for testing)
 */
export const clearRateCache = () => {
  rateCache.clear();
  console.log("[CurrencyService] Rate cache cleared");
};
