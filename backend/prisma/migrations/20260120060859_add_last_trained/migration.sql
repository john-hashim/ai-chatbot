/*
  Warnings:

  - You are about to alter the column `embedding` on the `DocumentChunk` table. The data in that column could be lost. The data in that column will be cast from `vector(384)` to `Unsupported("vector(384)")`.

*/
-- DropIndex
DROP INDEX "public"."embedding_idx";

-- AlterTable
ALTER TABLE "DocumentChunk" ALTER COLUMN "embedding" SET DATA TYPE vector(384);

-- AlterTable
ALTER TABLE "chatbots" ADD COLUMN     "last_trained" TIMESTAMP(3);
