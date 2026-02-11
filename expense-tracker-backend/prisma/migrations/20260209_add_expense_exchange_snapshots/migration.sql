-- Add exchange rate snapshot fields for finance-correct FX
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "exchangeRateBase" TEXT;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "exchangeRates" JSONB;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "exchangeRateTimestamp" TIMESTAMP(3);
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "rateProvider" TEXT;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "rateTimestamp" TIMESTAMP(3);
