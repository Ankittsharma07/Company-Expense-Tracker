import type { Expense } from "./api";

const normalizeCurrencyCode = (currency?: string | null) => {
  if (!currency || typeof currency !== "string") return null;
  return currency.trim().toUpperCase();
};

const normalizeRatesMap = (rates: unknown) => {
  if (!rates || typeof rates !== "object") return null;
  const normalized: Record<string, number> = {};
  Object.entries(rates as Record<string, unknown>).forEach(([code, value]) => {
    const normalizedCode = normalizeCurrencyCode(code);
    const numericValue = Number(value);
    if (normalizedCode && Number.isFinite(numericValue)) {
      normalized[normalizedCode] = numericValue;
    }
  });
  return Object.keys(normalized).length ? normalized : null;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getConversionRate = ({
  fromCurrency,
  toCurrency,
  exchangeRateBase,
  exchangeRates,
}: {
  fromCurrency?: string | null;
  toCurrency?: string | null;
  exchangeRateBase?: string | null;
  exchangeRates?: Record<string, number> | null | unknown;
}) => {
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

export const getExpenseDisplayValue = (expense: Expense, displayCurrency?: string) => {
  const targetCurrency = normalizeCurrencyCode(displayCurrency);
  const originalAmount = toNumber(expense.originalAmount ?? expense.amount ?? 0);
  const originalCurrency = normalizeCurrencyCode(expense.originalCurrency ?? expense.currency);

  if (targetCurrency && expense.exchangeRateBase && expense.exchangeRates && originalCurrency) {
    const rate = getConversionRate({
      fromCurrency: originalCurrency,
      toCurrency: targetCurrency,
      exchangeRateBase: expense.exchangeRateBase,
      exchangeRates: expense.exchangeRates,
    });

    if (rate) {
      return {
        amount: originalAmount * rate,
        currency: targetCurrency,
        isFallback: false,
      };
    }
  }

  const fallbackAmount = toNumber(expense.baseAmount ?? expense.amount ?? 0);
  const fallbackCurrency = normalizeCurrencyCode(
    expense.baseCurrency ?? expense.currency ?? targetCurrency ?? "USD"
  );

  return {
    amount: fallbackAmount,
    currency: fallbackCurrency || "USD",
    isFallback: true,
  };
};

export const sumExpensesInCurrency = (
  expenses: Expense[],
  displayCurrency?: string,
  predicate?: (expense: Expense) => boolean
) => {
  const filtered = predicate ? expenses.filter(predicate) : expenses;
  return filtered.reduce((sum, expense) => {
    const { amount } = getExpenseDisplayValue(expense, displayCurrency);
    return sum + amount;
  }, 0);
};

export const sumExpensesInCurrencyDetailed = (
  expenses: Expense[],
  displayCurrency?: string,
  predicate?: (expense: Expense) => boolean
) => {
  const filtered = predicate ? expenses.filter(predicate) : expenses;
  const normalizedDisplay = normalizeCurrencyCode(displayCurrency);
  const fallbackCurrency =
    normalizeCurrencyCode(filtered[0]?.baseCurrency ?? filtered[0]?.currency) ||
    normalizedDisplay ||
    "USD";

  const canConvertAll = normalizedDisplay
    ? normalizedDisplay === fallbackCurrency ||
      filtered.every((expense) => !getExpenseDisplayValue(expense, normalizedDisplay).isFallback)
    : false;

  const targetCurrency = canConvertAll ? normalizedDisplay : undefined;
  const resolvedCurrency = canConvertAll ? normalizedDisplay : fallbackCurrency;

  const total = filtered.reduce((sum, expense) => {
    const { amount } = getExpenseDisplayValue(expense, targetCurrency);
    return sum + amount;
  }, 0);

  return { total, currency: resolvedCurrency };
};
