-- Ensure AuthProvider enum exists and has LOCAL_GOOGLE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthProvider') THEN
    CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'LOCAL_GOOGLE');
  ELSIF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AuthProvider' AND e.enumlabel = 'LOCAL_GOOGLE'
  ) THEN
    ALTER TYPE "AuthProvider" ADD VALUE 'LOCAL_GOOGLE';
  END IF;
END $$;

-- Add auth provider + profile fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleAvatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredCurrency" TEXT;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
