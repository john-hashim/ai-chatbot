/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `chatbots` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "chatbots_name_key" ON "chatbots"("name");
