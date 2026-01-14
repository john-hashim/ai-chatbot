/*
  Warnings:

  - You are about to alter the column `embedding` on the `DocumentChunk` table. The data in that column could be lost. The data in that column will be cast from `vector(1536)` to `Unsupported("vector(384)")`.

*/
-- DropIndex
DROP INDEX "public"."embedding_idx";

-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "embedding" SET DATA TYPE vector(384);

-- CreateIndex: HNSW index for fast vector similarity search
CREATE INDEX "embedding_idx" ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);
