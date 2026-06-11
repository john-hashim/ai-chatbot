-- CreateEnum
CREATE TYPE "KanbanBoardType" AS ENUM ('MANUAL', 'AUTOMATED');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('BOOKING', 'AUTOMATED', 'MANUAL');

-- CreateTable
CREATE TABLE "kanban_columns" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "board" "KanbanBoardType" NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "sessionId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'playground',
    "type" "LeadType" NOT NULL,
    "trigger" TEXT,
    "meta" JSONB,
    "manualColumnId" TEXT NOT NULL,
    "automatedColumnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kanban_columns_chatbotId_board_idx" ON "kanban_columns"("chatbotId", "board");

-- CreateIndex
CREATE INDEX "leads_chatbotId_idx" ON "leads"("chatbotId");

-- CreateIndex
CREATE INDEX "leads_manualColumnId_idx" ON "leads"("manualColumnId");

-- CreateIndex
CREATE INDEX "leads_automatedColumnId_idx" ON "leads"("automatedColumnId");

-- CreateIndex
CREATE UNIQUE INDEX "leads_sessionId_type_key" ON "leads"("sessionId", "type");

-- AddForeignKey
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_manualColumnId_fkey" FOREIGN KEY ("manualColumnId") REFERENCES "kanban_columns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_automatedColumnId_fkey" FOREIGN KEY ("automatedColumnId") REFERENCES "kanban_columns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
