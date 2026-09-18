-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "lastReportSentAt" TIMESTAMP(3),
ADD COLUMN     "lastSitemapCheckAt" TIMESTAMP(3),
ADD COLUMN     "lastSitemapIssues" TEXT,
ADD COLUMN     "notifyByEmail" BOOLEAN NOT NULL DEFAULT true;
