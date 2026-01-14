/*
  Warnings:

  - You are about to alter the column `embedding` on the `DocumentChunk` table. The data in that column could be lost. The data in that column will be cast from `vector(1536)` to `Unsupported("vector(1536)")`.

*/
-- DropIndex
DROP INDEX "public"."embedding_idx";

-- AlterTable
ALTER TABLE "DocumentChunk" ALTER COLUMN "embedding" SET DATA TYPE vector(1536);

-- AlterTable
ALTER TABLE "chatbots" ADD COLUMN     "totalSize" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "embedding_idx" ON "DocumentChunk" USING ivfflat (embedding vector_cosine_ops);
