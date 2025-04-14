-- DropForeignKey
ALTER TABLE "Amistad" DROP CONSTRAINT "Amistad_NickFriendReceiver_fkey";

-- DropForeignKey
ALTER TABLE "Amistad" DROP CONSTRAINT "Amistad_NickFriendSender_fkey";

-- DropForeignKey
ALTER TABLE "CancionEscuchada" DROP CONSTRAINT "CancionEscuchada_EmailUsuario_fkey";

-- DropForeignKey
ALTER TABLE "CancionEscuchando" DROP CONSTRAINT "CancionEscuchando_EmailUsuario_fkey";

-- DropForeignKey
ALTER TABLE "CancionGuardada" DROP CONSTRAINT "CancionGuardada_EmailUsuario_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_EmailUsuario_fkey";

-- DropForeignKey
ALTER TABLE "ListaReproduccion" DROP CONSTRAINT "ListaReproduccion_EmailAutor_fkey";

-- DropForeignKey
ALTER TABLE "Mensaje" DROP CONSTRAINT "Mensaje_EmailReceiver_fkey";

-- DropForeignKey
ALTER TABLE "Mensaje" DROP CONSTRAINT "Mensaje_EmailSender_fkey";

-- DropForeignKey
ALTER TABLE "Preferencia" DROP CONSTRAINT "Preferencia_Email_fkey";

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_EmailUsuario_fkey" FOREIGN KEY ("EmailUsuario") REFERENCES "Usuario"("Email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaReproduccion" ADD CONSTRAINT "ListaReproduccion_EmailAutor_fkey" FOREIGN KEY ("EmailAutor") REFERENCES "Usuario"("Email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancionGuardada" ADD CONSTRAINT "CancionGuardada_EmailUsuario_fkey" FOREIGN KEY ("EmailUsuario") REFERENCES "Usuario"("Email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancionEscuchada" ADD CONSTRAINT "CancionEscuchada_EmailUsuario_fkey" FOREIGN KEY ("EmailUsuario") REFERENCES "Usuario"("Email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancionEscuchando" ADD CONSTRAINT "CancionEscuchando_EmailUsuario_fkey" FOREIGN KEY ("EmailUsuario") REFERENCES "Usuario"("Email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_EmailSender_fkey" FOREIGN KEY ("EmailSender") REFERENCES "Usuario"("Email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_EmailReceiver_fkey" FOREIGN KEY ("EmailReceiver") REFERENCES "Usuario"("Email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amistad" ADD CONSTRAINT "Amistad_NickFriendSender_fkey" FOREIGN KEY ("NickFriendSender") REFERENCES "Usuario"("Nick") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amistad" ADD CONSTRAINT "Amistad_NickFriendReceiver_fkey" FOREIGN KEY ("NickFriendReceiver") REFERENCES "Usuario"("Nick") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preferencia" ADD CONSTRAINT "Preferencia_Email_fkey" FOREIGN KEY ("Email") REFERENCES "Usuario"("Email") ON DELETE CASCADE ON UPDATE CASCADE;
