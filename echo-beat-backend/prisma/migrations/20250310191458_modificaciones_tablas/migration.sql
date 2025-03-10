/*
  Warnings:

  - You are about to drop the column `EsPrivada` on the `ListaReproduccion` table. All the data in the column will be lost.
  - You are about to drop the `GeneroCancion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GeneroCancion" DROP CONSTRAINT "GeneroCancion_IdCancion_fkey";

-- DropForeignKey
ALTER TABLE "GeneroCancion" DROP CONSTRAINT "GeneroCancion_NombreGenero_fkey";

-- AlterTable
ALTER TABLE "Cancion" ADD COLUMN     "Genero" TEXT;

-- AlterTable
ALTER TABLE "ListaReproduccion" DROP COLUMN "EsPrivada",
ADD COLUMN     "TipoPrivacidad" TEXT NOT NULL DEFAULT 'privado';

-- DropTable
DROP TABLE "GeneroCancion";
