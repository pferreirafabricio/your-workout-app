-- AlterTable
ALTER TABLE "UserPreference"
ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'UTC';
