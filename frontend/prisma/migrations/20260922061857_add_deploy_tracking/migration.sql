-- AlterTable
ALTER TABLE "technical_seo_scans" ADD COLUMN     "fixMergeCommitSha" TEXT,
ADD COLUMN     "fixRevertCommitSha" TEXT;
