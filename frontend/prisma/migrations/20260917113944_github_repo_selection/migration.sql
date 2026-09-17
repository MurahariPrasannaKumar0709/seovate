-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "lastPrNumber" INTEGER,
ADD COLUMN     "repoFullName" TEXT,
ADD COLUMN     "siteUrl" TEXT;
