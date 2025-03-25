/*
  Warnings:

  - A unique constraint covering the columns `[EmailUsuario]` on the table `CancionEscuchando` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CancionEscuchando_EmailUsuario_key" ON "CancionEscuchando"("EmailUsuario");
