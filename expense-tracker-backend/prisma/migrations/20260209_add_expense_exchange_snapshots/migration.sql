-- Add exchange rate snapshot fields for finance-correct FX
ALTER TABLE "Expense" ADD COLUMN "exchangeRateBase" TEXT;
ALTER TABLE "Expense" ADD COLUMN "exchangeRates" JSONB;
ALTER TABLE "Expense" ADD COLUMN "exchangeRateTimestamp" TIMESTAMP(3);
