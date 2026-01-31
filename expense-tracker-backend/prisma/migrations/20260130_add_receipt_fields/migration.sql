-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "receiptPublicId" TEXT,
ADD COLUMN     "receiptType" TEXT,
ADD COLUMN     "uploadedAt" TIMESTAMP(3);
