import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/config/db.js";
import { fetchHistoricalExchangeRatesSnapshot } from "../src/services/currency/currency.service.js";
import { POPULAR_CURRENCIES } from "../src/services/currency/currency.constants.js";

const SUPPORTED_CURRENCY_CODES = POPULAR_CURRENCIES.map((currency) => currency.code);
const DEFAULT_SNAPSHOT_BASE = "USD";
const BATCH_SIZE = 100;

const normalizeCurrencyCode = (currency) => {
  if (!currency || typeof currency !== "string") return null;
  return currency.trim().toUpperCase();
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDateKey = (expense) => {
  const dateValue = expense.expenseDate || expense.createdAt || expense.rateTimestamp;
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const getStoredExchangeRate = (expense) => {
  const explicitRate = toNumber(expense.exchangeRate);
  if (explicitRate && explicitRate > 0) return explicitRate;

  const originalAmount = toNumber(expense.originalAmount ?? expense.amount);
  const baseAmount = toNumber(expense.baseAmount);
  if (originalAmount && baseAmount && originalAmount > 0) {
    return baseAmount / originalAmount;
  }

  return null;
};

const buildExchangeRatesForExpense = ({ expense, snapshot }) => {
  const originalCurrency = normalizeCurrencyCode(expense.originalCurrency ?? expense.currency);
  if (!originalCurrency) return null;

  const baseCurrency = normalizeCurrencyCode(expense.baseCurrency ?? expense.currency);
  const snapshotRates = snapshot.rates || {};

  const baseRateUSD =
    originalCurrency === snapshot.baseCurrency ? 1 : snapshotRates[originalCurrency];
  if (!baseRateUSD) return null;

  const baseCurrencyRateUSD =
    baseCurrency && baseCurrency === snapshot.baseCurrency ? 1 : snapshotRates[baseCurrency];
  const storedRate = getStoredExchangeRate(expense);
  let scale = 1;

  if (storedRate && baseCurrencyRateUSD) {
    const historicalRate = baseCurrencyRateUSD / baseRateUSD;
    if (historicalRate) {
      scale = storedRate / historicalRate;
    }
  }

  const exchangeRates = {
    [originalCurrency]: 1,
  };

  SUPPORTED_CURRENCY_CODES.forEach((code) => {
    const currency = normalizeCurrencyCode(code);
    if (!currency || currency === originalCurrency) return;
    const rateUSD = currency === snapshot.baseCurrency ? 1 : snapshotRates[currency];
    if (!rateUSD) return;
    exchangeRates[currency] = (rateUSD / baseRateUSD) * scale;
  });

  return {
    exchangeRateBase: originalCurrency,
    exchangeRates,
  };
};

const run = async () => {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");

  const snapshotCache = new Map();
  let updatedCount = 0;
  let skippedCount = 0;

  let lastId = null;
  while (true) {
    const batch = await prisma.expense.findMany({
      where: {
        OR: [
          { exchangeRateBase: null },
          { exchangeRates: { equals: Prisma.DbNull } },
        ],
      },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
      select: {
        id: true,
        expenseDate: true,
        createdAt: true,
        rateTimestamp: true,
        originalAmount: true,
        originalCurrency: true,
        amount: true,
        currency: true,
        baseAmount: true,
        baseCurrency: true,
        exchangeRate: true,
      },
    });

    if (!batch.length) {
      break;
    }

    for (const expense of batch) {
      lastId = expense.id;
      const dateKey = getDateKey(expense);
      const originalCurrency = normalizeCurrencyCode(expense.originalCurrency ?? expense.currency);

      if (!dateKey || !originalCurrency) {
        skippedCount += 1;
        continue;
      }

      let snapshot = snapshotCache.get(dateKey);
      if (snapshot === undefined) {
        try {
          snapshot = await fetchHistoricalExchangeRatesSnapshot({
            date: dateKey,
            baseCurrency: DEFAULT_SNAPSHOT_BASE,
            targetCurrencies: SUPPORTED_CURRENCY_CODES,
          });
          snapshotCache.set(dateKey, snapshot);
        } catch (error) {
          console.error(`[FX Backfill] Failed to fetch historical rates for ${dateKey}:`, error.message);
          snapshotCache.set(dateKey, null);
          skippedCount += 1;
          continue;
        }
      }

      if (!snapshot) {
        skippedCount += 1;
        continue;
      }

      const exchangePayload = buildExchangeRatesForExpense({ expense, snapshot });
      if (!exchangePayload) {
        skippedCount += 1;
        continue;
      }

      if (!dryRun) {
        await prisma.expense.update({
          where: { id: expense.id },
          data: {
            exchangeRateBase: exchangePayload.exchangeRateBase,
            exchangeRates: exchangePayload.exchangeRates,
            exchangeRateTimestamp: snapshot.timestamp,
          },
        });
      }

      updatedCount += 1;
    }
  }

  console.log(`[FX Backfill] Updated ${updatedCount} expenses.`);
  console.log(`[FX Backfill] Skipped ${skippedCount} expenses.`);
  if (dryRun) {
    console.log("[FX Backfill] Dry run mode enabled; no database updates were made.");
  }
};

run()
  .catch((error) => {
    console.error("[FX Backfill] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
