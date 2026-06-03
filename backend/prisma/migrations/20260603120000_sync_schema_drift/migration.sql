-- CreateEnum
CREATE TYPE "EndUserKind" AS ENUM ('EMAIL', 'PHONE', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "BookingState" AS ENUM ('IDLE', 'AWAITING_DATE', 'AWAITING_TIME', 'AWAITING_CONTACT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('GOOGLE_MEET', 'IN_PERSON', 'ZOOM', 'PHONE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'UPCOMING', 'PAST', 'CANCELLED');

-- AlterTable
ALTER TABLE "DocumentChunk" ALTER COLUMN "embedding" SET DATA TYPE vector(384);

-- AlterTable
ALTER TABLE "booking_configs" ADD COLUMN     "locationAddress" TEXT,
ADD COLUMN     "locationPhone" TEXT,
ADD COLUMN     "locationType" "LocationType";

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "actionMeta" JSONB,
ADD COLUMN     "actionType" TEXT,
ADD COLUMN     "isAction" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN     "bookingDraft" JSONB,
ADD COLUMN     "bookingState" "BookingState" NOT NULL DEFAULT 'IDLE',
ADD COLUMN     "endUserId" TEXT;

-- AlterTable
ALTER TABLE "chatbots" ADD COLUMN     "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "selectedModel" TEXT;

-- CreateTable
CREATE TABLE "end_users" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "kind" "EndUserKind" NOT NULL,
    "preferredLanguage" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "end_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "interestedTopics" TEXT,
    "date" TEXT NOT NULL,
    "timeslot" TEXT NOT NULL,
    "duration" INTEGER,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'UPCOMING',
    "timezone" TEXT,
    "locationType" "LocationType",
    "locationAddress" TEXT,
    "locationPhone" TEXT,
    "meetLink" TEXT,
    "googleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_integrations" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accountEmail" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "end_users_chatbotId_idx" ON "end_users"("chatbotId");

-- CreateIndex
CREATE INDEX "end_users_expiresAt_idx" ON "end_users"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "end_users_chatbotId_kind_identifier_key" ON "end_users"("chatbotId", "kind", "identifier");

-- CreateIndex
CREATE INDEX "appointments_chatbotId_idx" ON "appointments"("chatbotId");

-- CreateIndex
CREATE INDEX "appointments_sessionId_idx" ON "appointments"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_sessionId_date_timeslot_key" ON "appointments"("sessionId", "date", "timeslot");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_integrations_chatbotId_key" ON "calendar_integrations"("chatbotId");

-- CreateIndex
CREATE INDEX "chat_sessions_endUserId_idx" ON "chat_sessions"("endUserId");

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_endUserId_fkey" FOREIGN KEY ("endUserId") REFERENCES "end_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "end_users" ADD CONSTRAINT "end_users_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

