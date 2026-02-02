-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "inAppNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationAuditStatus" AS ENUM ('SENT', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "NotificationAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" "Role" NOT NULL,
    "notificationType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationAuditStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationAuditLog_userId_idx" ON "NotificationAuditLog"("userId");

-- CreateIndex
CREATE INDEX "NotificationAuditLog_userId_createdAt_idx" ON "NotificationAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationAuditLog_channel_idx" ON "NotificationAuditLog"("channel");

-- CreateIndex
CREATE INDEX "NotificationAuditLog_status_idx" ON "NotificationAuditLog"("status");

-- AddForeignKey
ALTER TABLE "NotificationAuditLog" ADD CONSTRAINT "NotificationAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
