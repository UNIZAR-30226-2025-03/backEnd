/*
  Warnings:

  - You are about to drop the column `UltimaCancionEscuchada` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the `tipoReproduccionActual` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tipoReproduccionActual" DROP CONSTRAINT "tipoReproduccionActual_EmailUsuario_fkey";

-- DropForeignKey
ALTER TABLE "tipoReproduccionActual" DROP CONSTRAINT "tipoReproduccionActual_IdLista_fkey";

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "UltimaCancionEscuchada",
ADD COLUMN     "ColaReproduccion" JSONB;

-- DropTable
DROP TABLE "tipoReproduccionActual";

-- CreateTable
CREATE TABLE "Like" (
    "EmailUsuario" TEXT NOT NULL,
    "IdLista" INTEGER NOT NULL,
    "tieneLike" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("EmailUsuario","IdLista")
);

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_EmailUsuario_fkey" FOREIGN KEY ("EmailUsuario") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_IdLista_fkey" FOREIGN KEY ("IdLista") REFERENCES "Lista"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
