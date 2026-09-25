/*
  Warnings:

  - Added the required column `repositoryId` to the `AgentJob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AgentJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AgentJob" ADD COLUMN     "repositoryId" TEXT NOT NULL,
ADD COLUMN     "resultDiff" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'QUEUED';

-- CreateIndex
CREATE INDEX "AgentJob_status_createdAt_idx" ON "AgentJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AgentJob" ADD CONSTRAINT "AgentJob_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentJob" ADD CONSTRAINT "AgentJob_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
