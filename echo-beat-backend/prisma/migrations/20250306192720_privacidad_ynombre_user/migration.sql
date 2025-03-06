/*
  Warnings:

  - You are about to drop the column `BooleanPrivacidad` on the `Usuario` table. All the data in the column will be lost.
  - Added the required column `NombreCompleto` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "BooleanPrivacidad",
ADD COLUMN     "NombreCompleto" TEXT NOT NULL,
ADD COLUMN     "Privacidad" TEXT NOT NULL DEFAULT 'privado';
