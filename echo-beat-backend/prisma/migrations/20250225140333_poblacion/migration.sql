-- CreateTable
CREATE TABLE "Usuario" (
    "Email" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "FechaNacimiento" TIMESTAMP(3) NOT NULL,
    "Nick" TEXT NOT NULL,
    "LinkFoto" TEXT,
    "BooleanPrivacidad" TEXT NOT NULL DEFAULT 'false',
    "UltimaListaEscuchada" INTEGER,
    "UltimaCancionEscuchada" INTEGER,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("Email")
);

-- CreateTable
CREATE TABLE "Artista" (
    "Nombre" TEXT NOT NULL,
    "Biografia" TEXT NOT NULL,
    "NumOyentesTotales" INTEGER NOT NULL DEFAULT 0,
    "FotoPerfil" TEXT NOT NULL,

    CONSTRAINT "Artista_pkey" PRIMARY KEY ("Nombre")
);

-- CreateTable
CREATE TABLE "Album" (
    "Id" INTEGER NOT NULL,
    "NumReproducciones" INTEGER NOT NULL DEFAULT 0,
    "FechaLanzamiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Cancion" (
    "Id" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Duracion" INTEGER NOT NULL,
    "NumReproducciones" INTEGER NOT NULL DEFAULT 0,
    "NumFavoritos" INTEGER NOT NULL DEFAULT 0,
    "Portada" TEXT NOT NULL,

    CONSTRAINT "Cancion_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Genero" (
    "NombreGenero" TEXT NOT NULL,

    CONSTRAINT "Genero_pkey" PRIMARY KEY ("NombreGenero")
);

-- CreateTable
CREATE TABLE "GeneroCancion" (
    "NombreGenero" TEXT NOT NULL,
    "IdCancion" INTEGER NOT NULL,

    CONSTRAINT "GeneroCancion_pkey" PRIMARY KEY ("NombreGenero","IdCancion")
);

-- CreateTable
CREATE TABLE "Lista" (
    "Id" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "NumCanciones" INTEGER NOT NULL DEFAULT 0,
    "Duracion" INTEGER NOT NULL DEFAULT 0,
    "NumLikes" INTEGER NOT NULL DEFAULT 0,
    "Descripcion" TEXT NOT NULL,
    "Portada" TEXT NOT NULL,

    CONSTRAINT "Lista_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ListaReproduccion" (
    "Id" INTEGER NOT NULL,
    "Nombre" TEXT NOT NULL,
    "EsPrivada" TEXT NOT NULL DEFAULT 'false',
    "EmailAutor" TEXT NOT NULL,
    "Genero" TEXT NOT NULL DEFAULT 'Sin genero',

    CONSTRAINT "ListaReproduccion_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "CancionGuardada" (
    "EmailUsuario" TEXT NOT NULL,
    "IdCancion" INTEGER NOT NULL,
    "FechaGuardado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancionGuardada_pkey" PRIMARY KEY ("EmailUsuario","IdCancion")
);

-- CreateTable
CREATE TABLE "CancionEscuchada" (
    "EmailUsuario" TEXT NOT NULL,
    "IdCancion" INTEGER NOT NULL,
    "NumReproducciones" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CancionEscuchada_pkey" PRIMARY KEY ("EmailUsuario","IdCancion")
);

-- CreateTable
CREATE TABLE "CancionEscuchando" (
    "EmailUsuario" TEXT NOT NULL,
    "IdCancion" INTEGER NOT NULL,
    "MinutoEscucha" INTEGER NOT NULL,

    CONSTRAINT "CancionEscuchando_pkey" PRIMARY KEY ("EmailUsuario","IdCancion")
);

-- CreateTable
CREATE TABLE "tipoReproduccionActual" (
    "EmailUsuario" TEXT NOT NULL,
    "IdLista" INTEGER NOT NULL,
    "HayReproduccionAleatoria" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tipoReproduccionActual_pkey" PRIMARY KEY ("EmailUsuario","IdLista")
);

-- CreateTable
CREATE TABLE "AutorAlbum" (
    "IdAlbum" INTEGER NOT NULL,
    "NombreArtista" TEXT NOT NULL,

    CONSTRAINT "AutorAlbum_pkey" PRIMARY KEY ("IdAlbum","NombreArtista")
);

-- CreateTable
CREATE TABLE "AutorCancion" (
    "IdCancion" INTEGER NOT NULL,
    "NombreArtista" TEXT NOT NULL,

    CONSTRAINT "AutorCancion_pkey" PRIMARY KEY ("IdCancion","NombreArtista")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "EmailSender" TEXT NOT NULL,
    "EmailReceiver" TEXT NOT NULL,
    "Mensaje" TEXT NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("EmailSender","EmailReceiver","Fecha")
);

-- CreateTable
CREATE TABLE "Amistad" (
    "EmailFriendSender" TEXT NOT NULL,
    "EmailFriendReceiver" TEXT NOT NULL,
    "FechaComienzoAmistad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Amistad_pkey" PRIMARY KEY ("EmailFriendSender","EmailFriendReceiver")
);

-- CreateTable
CREATE TABLE "Preferencia" (
    "NombreGenero" TEXT NOT NULL,
    "Email" TEXT NOT NULL,

    CONSTRAINT "Preferencia_pkey" PRIMARY KEY ("NombreGenero","Email")
);

-- CreateTable
CREATE TABLE "PosicionCancion" (
    "IdLista" INTEGER NOT NULL,
    "IdCancion" INTEGER NOT NULL,
    "Posicion" INTEGER NOT NULL,

    CONSTRAINT "PosicionCancion_pkey" PRIMARY KEY ("IdLista","IdCancion")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_Nick_key" ON "Usuario"("Nick");

-- CreateIndex
CREATE UNIQUE INDEX "Album_Id_key" ON "Album"("Id");

-- CreateIndex
CREATE UNIQUE INDEX "ListaReproduccion_Id_key" ON "ListaReproduccion"("Id");

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Lista"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneroCancion" ADD CONSTRAINT "GeneroCancion_NombreGenero_fkey" FOREIGN KEY ("NombreGenero") REFERENCES "Genero"("NombreGenero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneroCancion" ADD CONSTRAINT "GeneroCancion_IdCancion_fkey" FOREIGN KEY ("IdCancion") REFERENCES "Cancion"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaReproduccion" ADD CONSTRAINT "ListaReproduccion_EmailAutor_fkey" FOREIGN KEY ("EmailAutor") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaReproduccion" ADD CONSTRAINT "ListaReproduccion_Id_fkey" FOREIGN KEY ("Id") REFERENCES "Lista"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancionGuardada" ADD CONSTRAINT "CancionGuardada_EmailUsuario_fkey" FOREIGN KEY ("EmailUsuario") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancionGuardada" ADD CONSTRAINT "CancionGuardada_IdCancion_fkey" FOREIGN KEY ("IdCancion") REFERENCES "Cancion"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancionEscuchada" ADD CONSTRAINT "CancionEscuchada_EmailUsuario_fkey" FOREIGN KEY ("EmailUsuario") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancionEscuchada" ADD CONSTRAINT "CancionEscuchada_IdCancion_fkey" FOREIGN KEY ("IdCancion") REFERENCES "Cancion"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancionEscuchando" ADD CONSTRAINT "CancionEscuchando_EmailUsuario_fkey" FOREIGN KEY ("EmailUsuario") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancionEscuchando" ADD CONSTRAINT "CancionEscuchando_IdCancion_fkey" FOREIGN KEY ("IdCancion") REFERENCES "Cancion"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipoReproduccionActual" ADD CONSTRAINT "tipoReproduccionActual_EmailUsuario_fkey" FOREIGN KEY ("EmailUsuario") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipoReproduccionActual" ADD CONSTRAINT "tipoReproduccionActual_IdLista_fkey" FOREIGN KEY ("IdLista") REFERENCES "Lista"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorAlbum" ADD CONSTRAINT "AutorAlbum_IdAlbum_fkey" FOREIGN KEY ("IdAlbum") REFERENCES "Album"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorAlbum" ADD CONSTRAINT "AutorAlbum_NombreArtista_fkey" FOREIGN KEY ("NombreArtista") REFERENCES "Artista"("Nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorCancion" ADD CONSTRAINT "AutorCancion_IdCancion_fkey" FOREIGN KEY ("IdCancion") REFERENCES "Cancion"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorCancion" ADD CONSTRAINT "AutorCancion_NombreArtista_fkey" FOREIGN KEY ("NombreArtista") REFERENCES "Artista"("Nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_EmailSender_fkey" FOREIGN KEY ("EmailSender") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_EmailReceiver_fkey" FOREIGN KEY ("EmailReceiver") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amistad" ADD CONSTRAINT "Amistad_EmailFriendSender_fkey" FOREIGN KEY ("EmailFriendSender") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amistad" ADD CONSTRAINT "Amistad_EmailFriendReceiver_fkey" FOREIGN KEY ("EmailFriendReceiver") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preferencia" ADD CONSTRAINT "Preferencia_NombreGenero_fkey" FOREIGN KEY ("NombreGenero") REFERENCES "Genero"("NombreGenero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preferencia" ADD CONSTRAINT "Preferencia_Email_fkey" FOREIGN KEY ("Email") REFERENCES "Usuario"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosicionCancion" ADD CONSTRAINT "PosicionCancion_IdLista_fkey" FOREIGN KEY ("IdLista") REFERENCES "Lista"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosicionCancion" ADD CONSTRAINT "PosicionCancion_IdCancion_fkey" FOREIGN KEY ("IdCancion") REFERENCES "Cancion"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
