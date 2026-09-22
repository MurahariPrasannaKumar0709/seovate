-- CreateTable
CREATE TABLE "technical_seo_scans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "pagesScanned" INTEGER NOT NULL DEFAULT 0,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "technical_seo_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_seo_findings" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technical_seo_findings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "technical_seo_scans_userId_startedAt_idx" ON "technical_seo_scans"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "technical_seo_findings_scanId_idx" ON "technical_seo_findings"("scanId");

-- AddForeignKey
ALTER TABLE "technical_seo_scans" ADD CONSTRAINT "technical_seo_scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_seo_findings" ADD CONSTRAINT "technical_seo_findings_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "technical_seo_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
