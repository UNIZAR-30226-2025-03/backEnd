/*
  Warnings:

  - The primary key for the `CancionEscuchando` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "CancionEscuchando" DROP CONSTRAINT "CancionEscuchando_pkey",
ADD CONSTRAINT "CancionEscuchando_pkey" PRIMARY KEY ("EmailUsuario");
