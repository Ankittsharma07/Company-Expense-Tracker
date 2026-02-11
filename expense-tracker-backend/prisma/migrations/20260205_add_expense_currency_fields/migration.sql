-- Ensure Company base currency exists
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "baseCurrency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "Company" ALTER COLUMN "baseCurrency" SET DEFAULT 'INR';

-- Add new expense currency fields
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "exchangeRate" DECIMAL(18, 8);
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "baseAmount" DECIMAL(12, 2);
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "originalAmount" DECIMAL(12, 2);
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "originalCurrency" TEXT;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "baseCurrency" TEXT;

-- Backfill existing expenses
UPDATE "Expense" e
SET "originalAmount" = e."amount",
    "originalCurrency" = c."baseCurrency",
    "exchangeRate" = 1,
    "baseAmount" = e."amount",
    "baseCurrency" = c."baseCurrency"
FROM "Company" c
WHERE e."companyId" = c."id";

-- Safety fallbacks for any remaining nulls
UPDATE "Expense" SET "originalAmount" = "amount" WHERE "originalAmount" IS NULL;
UPDATE "Expense" SET "originalCurrency" = COALESCE("currency", "baseCurrency", 'INR') WHERE "originalCurrency" IS NULL;
UPDATE "Expense" SET "exchangeRate" = 1 WHERE "exchangeRate" IS NULL;
UPDATE "Expense" SET "baseAmount" = "amount" WHERE "baseAmount" IS NULL;
UPDATE "Expense" SET "baseCurrency" = COALESCE("baseCurrency", "originalCurrency", 'INR') WHERE "baseCurrency" IS NULL;

-- Enforce non-null constraints
ALTER TABLE "Expense" ALTER COLUMN "originalAmount" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "originalCurrency" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "exchangeRate" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "baseAmount" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "baseCurrency" SET NOT NULL;
