/*
  Warnings:

  - The primary key for the `Mensaje` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Mensaje" DROP CONSTRAINT "Mensaje_pkey",
ADD COLUMN     "Id" SERIAL NOT NULL,
ADD COLUMN     "Leido" BOOLEAN NOT NULL DEFAULT false,
ADD CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("Id");
