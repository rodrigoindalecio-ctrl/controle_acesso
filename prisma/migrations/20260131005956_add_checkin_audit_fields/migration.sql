-- AlterTable
ALTER TABLE "guests" ADD COLUMN "checkedInBy" TEXT;
ALTER TABLE "guests" ADD COLUMN "undoAt" DATETIME;
ALTER TABLE "guests" ADD COLUMN "undoBy" TEXT;
