/*
  Warnings:

  - Added the required column `TipoLista` to the `Lista` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lista" ADD COLUMN     "TipoLista" TEXT NOT NULL;
