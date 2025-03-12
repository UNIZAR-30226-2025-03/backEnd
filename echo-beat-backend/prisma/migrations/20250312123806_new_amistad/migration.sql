/*
  Warnings:

  - The primary key for the `Amistad` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `EmailFriendReceiver` on the `Amistad` table. All the data in the column will be lost.
  - You are about to drop the column `EmailFriendSender` on the `Amistad` table. All the data in the column will be lost.
  - Added the required column `NickFriendReceiver` to the `Amistad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `NickFriendSender` to the `Amistad` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Amistad" DROP CONSTRAINT "Amistad_EmailFriendReceiver_fkey";

-- DropForeignKey
ALTER TABLE "Amistad" DROP CONSTRAINT "Amistad_EmailFriendSender_fkey";

-- AlterTable
ALTER TABLE "Amistad" DROP CONSTRAINT "Amistad_pkey",
DROP COLUMN "EmailFriendReceiver",
DROP COLUMN "EmailFriendSender",
ADD COLUMN     "EstadoSolicitud" TEXT NOT NULL DEFAULT 'pendiente',
ADD COLUMN     "NickFriendReceiver" TEXT NOT NULL,
ADD COLUMN     "NickFriendSender" TEXT NOT NULL,
ALTER COLUMN "FechaComienzoAmistad" DROP NOT NULL,
ALTER COLUMN "FechaComienzoAmistad" DROP DEFAULT,
ADD CONSTRAINT "Amistad_pkey" PRIMARY KEY ("NickFriendSender", "NickFriendReceiver");

-- AddForeignKey
ALTER TABLE "Amistad" ADD CONSTRAINT "Amistad_NickFriendSender_fkey" FOREIGN KEY ("NickFriendSender") REFERENCES "Usuario"("Nick") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amistad" ADD CONSTRAINT "Amistad_NickFriendReceiver_fkey" FOREIGN KEY ("NickFriendReceiver") REFERENCES "Usuario"("Nick") ON DELETE RESTRICT ON UPDATE CASCADE;
