/*
  Warnings:

  - You are about to alter the column `embedding` on the `DocumentChunk` table. The data in that column could be lost. The data in that column will be cast from `vector(384)` to `Unsupported("vector(384)")`.
  - You are about to drop the column `last_trained` on the `chatbots` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,userId]` on the table `chatbots` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('WEEKLY', 'SPECIFIC_DATE');

-- DropIndex
DROP INDEX "public"."chatbots_name_key";

-- AlterTable
ALTER TABLE "DocumentChunk" ALTER COLUMN "embedding" SET DATA TYPE vector(384);

-- AlterTable
ALTER TABLE "chatbots" DROP COLUMN "last_trained",
ADD COLUMN     "autoshowDelaySeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "autoshowInitialPopup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "chatBubbleButtonColor" TEXT NOT NULL DEFAULT '#000000',
ADD COLUMN     "chatBubbleButtonPosition" TEXT NOT NULL DEFAULT 'right',
ADD COLUMN     "chatIcon" TEXT,
ADD COLUMN     "customInstruction" TEXT,
ADD COLUMN     "dismissibleNotice" TEXT,
ADD COLUMN     "footer" TEXT,
ADD COLUMN     "initialMessages" TEXT[],
ADD COLUMN     "instructionType" TEXT NOT NULL DEFAULT 'base',
ADD COLUMN     "lastTrained" TIMESTAMP(3),
ADD COLUMN     "messagePlaceholder" TEXT,
ADD COLUMN     "showSuggestedAfterFirst" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suggestedMessages" TEXT[];

-- CreateTable
CREATE TABLE "embed_configs" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "embedKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rateLimitPerMin" INTEGER NOT NULL DEFAULT 20,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embed_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'playground',
    "country" TEXT,
    "countryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "temperature" DOUBLE PRECISION,
    "tokensUsed" INTEGER,
    "responseTime" INTEGER,
    "sources" TEXT[],
    "confidenceScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_configs" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL,
    "appointmentDuration" INTEGER NOT NULL,
    "confirmationMessage" TEXT,
    "notificationEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySchedule" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "scheduleType" "ScheduleType" NOT NULL,
    "dayOfWeek" INTEGER,
    "specificDate" DATE,
    "timeSlots" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilitySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "embed_configs_chatbotId_key" ON "embed_configs"("chatbotId");

-- CreateIndex
CREATE UNIQUE INDEX "embed_configs_embedKey_key" ON "embed_configs"("embedKey");

-- CreateIndex
CREATE INDEX "embed_configs_embedKey_idx" ON "embed_configs"("embedKey");

-- CreateIndex
CREATE INDEX "chat_sessions_chatbotId_idx" ON "chat_sessions"("chatbotId");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_configs_chatbotId_key" ON "booking_configs"("chatbotId");

-- CreateIndex
CREATE INDEX "AvailabilitySchedule_chatbotId_idx" ON "AvailabilitySchedule"("chatbotId");

-- CreateIndex
CREATE UNIQUE INDEX "chatbots_name_userId_key" ON "chatbots"("name", "userId");

-- AddForeignKey
ALTER TABLE "embed_configs" ADD CONSTRAINT "embed_configs_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_configs" ADD CONSTRAINT "booking_configs_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySchedule" ADD CONSTRAINT "AvailabilitySchedule_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
