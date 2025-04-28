-- DropForeignKey
ALTER TABLE "AutorAlbum" DROP CONSTRAINT "AutorAlbum_NombreArtista_fkey";

-- DropForeignKey
ALTER TABLE "AutorCancion" DROP CONSTRAINT "AutorCancion_NombreArtista_fkey";

-- AddForeignKey
ALTER TABLE "AutorAlbum" ADD CONSTRAINT "AutorAlbum_NombreArtista_fkey" FOREIGN KEY ("NombreArtista") REFERENCES "Artista"("Nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorCancion" ADD CONSTRAINT "AutorCancion_NombreArtista_fkey" FOREIGN KEY ("NombreArtista") REFERENCES "Artista"("Nombre") ON DELETE CASCADE ON UPDATE CASCADE;
