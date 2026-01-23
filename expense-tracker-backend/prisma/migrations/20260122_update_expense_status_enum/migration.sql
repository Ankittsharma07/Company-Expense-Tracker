-- AlterEnum: Update ExpenseStatus enum values
-- Step 1: Create new enum type with new values
CREATE TYPE "ExpenseStatus_new" AS ENUM ('PENDING_MANAGER', 'PENDING_ADMIN', 'APPROVED', 'REJECTED');

-- Step 2: Alter column to use new enum with data mapping
ALTER TABLE "Expense" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Expense" ALTER COLUMN "status" TYPE "ExpenseStatus_new"
  USING (
    CASE
      WHEN status::text = 'PENDING' THEN 'PENDING_MANAGER'::text
      WHEN status::text = 'MANAGER_APPROVED' THEN 'PENDING_ADMIN'::text
      WHEN status::text = 'ADMIN_APPROVED' THEN 'APPROVED'::text
      ELSE status::text
    END
  )::"ExpenseStatus_new";
ALTER TABLE "Expense" ALTER COLUMN "status" SET DEFAULT 'PENDING_MANAGER'::"ExpenseStatus_new";

-- Step 3: Drop old enum and rename new one
DROP TYPE "ExpenseStatus";
ALTER TYPE "ExpenseStatus_new" RENAME TO "ExpenseStatus";

