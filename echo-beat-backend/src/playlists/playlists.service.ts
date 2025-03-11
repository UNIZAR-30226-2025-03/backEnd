import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PlaylistsService {
  private blobServiceClient: BlobServiceClient;
  constructor(private readonly prisma: PrismaService) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('Azure Storage connection string is not defined');
    }
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  /**
   * Devuelve la primera canción de la playlist (por posición más baja).
   * Retorna el nombre de archivo (por ejemplo, el campo Nombre) o null si no encuentra ninguna.
   */
  async getFirstSongInPlaylist(playlistId: string): Promise<string | null> {
    const firstPosition = await this.prisma.posicionCancion.findFirst({
      where: { IdLista: Number(playlistId) },
      orderBy: { Posicion: 'asc' },
    });

    if (!firstPosition) {
      return null;
    }

    const song = await this.prisma.cancion.findUnique({
      where: { Id: firstPosition.IdCancion },
    });

    // Retorna el nombre de la canción o null si no existe
    return song ? song.Nombre : null;
  }

  /**
   * Devuelve la siguiente canción de la playlist. Este ejemplo omite lógica avanzada:
   * simplemente hace skip de la primera posición y toma la siguiente en orden.
   * Puedes ajustar este método según tu caso de uso real.
   */
  async getNextSongInPlaylist(playlistId: string): Promise<string | null> {
    // Obtiene todas las canciones ordenadas por posición
    const positions = await this.prisma.posicionCancion.findMany({
      where: { IdLista: Number(playlistId) },
      orderBy: { Posicion: 'asc' },
      skip: 1,  // Se salta la primera
      take: 1,  // Toma la siguiente
    });

    if (positions.length === 0) {
      return null;
    }

    // Busca los datos de la canción
    const nextSong = await this.prisma.cancion.findUnique({
      where: { Id: positions[0].IdCancion },
    });

    return nextSong ? nextSong.Nombre : null;
  }

  /**
   * Retorna todas las playlists creadas por el usuario.
   * Incluye la información de la tabla Lista.
   */
  async findAllByUser(userEmail: string) {
    const playlists = await this.prisma.listaReproduccion.findMany({
      where: { EmailAutor: userEmail },
      include: {
        lista: true, // Incluye información adicional de la tabla Lista
      },
    });

    if (!playlists.length) {
      // Manejo opcional de caso sin playlists
      return { message: 'El usuario no tiene playlists', playlists: [] };
    }

    return playlists;
  }

  /**
   * Obtiene todas las canciones de una lista de reproducción.
   */
  async getSongsByPlaylistId(playlistId: string) {
    const playlist = await this.prisma.lista.findUnique({
      where: { Id: Number(playlistId) },
      include: {
        posiciones: {
          include: { cancion: true }
        }
      },
    });

    if (!playlist) {
      throw new NotFoundException(`No se encontró la playlist con ID ${playlistId}`);
    }

    // Extraer las canciones de la lista
    const canciones = playlist.posiciones.map(posicion => ({
      id: posicion.cancion.Id,
      nombre: posicion.cancion.Nombre,
      duracion: posicion.cancion.Duracion,
      numReproducciones: posicion.cancion.NumReproducciones,
      numFavoritos: posicion.cancion.NumFavoritos,
      portada: posicion.cancion.Portada,
    }));

    return { playlistId, nombreLista: playlist.Nombre, canciones };
  }

  async createPlaylist(
    emailUsuario: string,
    nombrePlaylist: string,
    descripcionPlaylist: string,
    tipoPrivacidad: string,
    file: Express.Multer.File
  ) {

    const usuario = await this.prisma.usuario.findUnique({
      where: { Email: emailUsuario },
    });

    if (!usuario) {
      throw new NotFoundException('No se encontró un usuario con ese correo.');
    }

    // 🔹 1️⃣ Validar que el tipo de privacidad es correcto
    if (tipoPrivacidad != "privado" && tipoPrivacidad != "protegido" && tipoPrivacidad != "publico") {
      throw new BadRequestException('El tipo de privacidad debe ser "publico", "privado" o "protegido".');
    }

    // 🔹 2️⃣ Subir la imagen a Azure Blob Storage
    const containerName = process.env.CONTAINER_LIST_PHOTOS;
    if (!containerName) {
      throw new Error('La variable de entorno CONTAINER_USER_PHOTOS no está definida.');
    }

    const newBlobName = `${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(newBlobName);

    await blobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    // 🔹 3️⃣ Obtener la URL de la imagen
    const imageUrl = `${containerClient.url}/${newBlobName}`;

    // 🔹 4️⃣ Insertar en la tabla Lista
    const newPlaylist = await this.prisma.lista.create({
      data: {
        Nombre: nombrePlaylist,
        NumCanciones: 0,
        Duracion: 0,
        NumLikes: 0,
        Descripcion: descripcionPlaylist,
        Portada: imageUrl,
        TipoLista: 'ListaReproduccion',
      },
    });

    // 🔹 5️⃣ Insertar en la tabla ListaReproduccion
    await this.prisma.listaReproduccion.create({
      data: {
        Id: newPlaylist.Id, // La misma ID de Lista
        Nombre: nombrePlaylist,
        TipoPrivacidad: tipoPrivacidad,
        EmailAutor: emailUsuario,
        Genero: "Sin genero",
      },
    });

    return {
      message: 'Playlist creada correctamente',
      playlistId: newPlaylist.Id,
      imageUrl: imageUrl,
    };
  }

  async deletePlaylist(playlistId: number) {
    // 🔹 1️⃣ Verificar si la playlist existe
    const playlist = await this.prisma.lista.findUnique({
      where: {
        Id: playlistId,  // Aquí estamos pasando correctamente el ID de la playlist
      },
      select: {
        Id: true,
        Portada: true,
      },
    });

    if (!playlist) {
      throw new NotFoundException('No se encontró la playlist con el ID proporcionado.');
    }

    // 🔹 2️⃣ Eliminar la portada de Azure Blob Storage
    if (playlist.Portada) {
      const oldBlobName = playlist.Portada.split('/').pop();
      const containerName = process.env.CONTAINER_LIST_PHOTOS;
      if (!containerName) {
        throw new Error('La variable de entorno CONTAINER_USER_PHOTOS no está definida.');
      }
      if (oldBlobName) {
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(oldBlobName);
        await blobClient.deleteIfExists();
      }
    }

    // 🔹 3️⃣ Borrar todas las filas en PosicionCancion donde IdLista sea el ID de la playlist
    await this.prisma.posicionCancion.deleteMany({
      where: { IdLista: playlistId },
    });

    // 🔹 4️⃣ Borrar la fila en ListaReproduccion
    await this.prisma.listaReproduccion.delete({
      where: { Id: playlistId },
    });

    // 🔹 5️⃣ Borrar la fila en Lista
    await this.prisma.lista.delete({
      where: { Id: playlistId },
    });

    // 🔹 6️⃣ Actualizar la tabla Usuario, poniendo UltimaListaEscuchada en null donde sea la playlist eliminada
    await this.prisma.usuario.updateMany({
      where: { UltimaListaEscuchada: playlistId },
      data: { UltimaListaEscuchada: null },
    });

    return { message: 'Playlist eliminada correctamente' };
  }

  async getAllListDefaultImageUrls() {
    // 🔹 Verificar que el contenedor está configurado

    const containerName = process.env.CONTAINER_DEFAULT_LIST_PHOTOS;

    if (!containerName) {
      throw new Error('La variable de entorno CONTAINER_DEFAULT_LIST_PHOTOS no está definida.');
    }

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const imageUrls: string[] = [];

    // 🔹 Acceder a todos los blobs en el contenedor
    for await (const blob of containerClient.listBlobsFlat()) {
      // Construir la URL de cada imagen
      const imageUrl = `${containerClient.url}/${blob.name}`;
      imageUrls.push(imageUrl);
    }

    return imageUrls;
  }

  async addSongToPlaylist(playlistId: number, songId: number) {
    // 🔹 1️⃣ Verificar si la playlist existe
    const playlist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('No se encontró la playlist con el ID proporcionado.');
    }

    // 🔹 2️⃣ Verificar si la canción existe
    const song = await this.prisma.cancion.findUnique({
      where: { Id: songId },
    });

    if (!song) {
      throw new NotFoundException('No se encontró la canción con el ID proporcionado.');
    }

    // 🔹 3️⃣ Obtener la última posición en la tabla PosicionCancion para la playlist
    const lastPosition = await this.prisma.posicionCancion.aggregate({
      _max: {
        Posicion: true,
      },
      where: {
        IdLista: playlistId,
      },
    });

    const newPosition = lastPosition._max.Posicion ? lastPosition._max.Posicion + 1 : 1;

    // 🔹 4️⃣ Insertar la nueva canción en la tabla PosicionCancion
    await this.prisma.posicionCancion.create({
      data: {
        IdLista: playlistId,
        IdCancion: songId,
        Posicion: newPosition,
      },
    });

    // 🔹 5️⃣ Contar los géneros de las canciones en la playlist
    const positionSongs = await this.prisma.posicionCancion.findMany({
      where: {
        IdLista: playlistId,
      },
      include: {
        cancion: true, // Incluimos la información de las canciones
      },
    });

    const genreCount: Record<string, number> = {};

    // Contamos cuántas veces aparece cada género
    positionSongs.forEach(({ cancion }) => {
      const genre = cancion.Genero || "Sin genero"; // Si no tiene género, lo asignamos como "Sin genero"
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    // 🔹 6️⃣ Determinar el género predominante
    const predominantGenre = Object.keys(genreCount).reduce((prev, curr) => {
      return genreCount[curr] > genreCount[prev] ? curr : prev;
    });

    // 🔹 7️⃣ Actualizar el género de la lista de reproducción
    await this.prisma.listaReproduccion.update({
      where: { Id: playlistId },
      data: {
        Genero: predominantGenre,
      },
    });

    return {
      message: 'Canción añadida a la playlist correctamente',
      position: newPosition,
      predominantGenre: predominantGenre, // Mostramos el género predominante
    };
  }

  async deleteSongFromPlaylist(playlistId: number, songId: number) {
    // 🔹 1️⃣ Verificar si la lista de reproducción existe
    const playlist = await this.prisma.lista.findUnique({
      where: { Id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('No se encontró la lista de reproducción con el ID proporcionado.');
    }

    // 🔹 2️⃣ Verificar si la canción existe
    const song = await this.prisma.cancion.findUnique({
      where: { Id: songId },
    });

    if (!song) {
      throw new NotFoundException('No se encontró la canción con el ID proporcionado.');
    }

    // 🔹 3️⃣ Eliminar la canción de la tabla PosicionCancion
    const songPosition = await this.prisma.posicionCancion.findUnique({
      where: {
        IdLista_IdCancion: { IdLista: playlistId, IdCancion: songId },
      },
    });

    if (!songPosition) {
      throw new NotFoundException('La canción no se encuentra en la playlist.');
    }

    // 🔹 4️⃣ Eliminar la fila de la canción de la tabla PosicionCancion
    await this.prisma.posicionCancion.delete({
      where: {
        IdLista_IdCancion: { IdLista: playlistId, IdCancion: songId },
      },
    });

    // 🔹 5️⃣ Actualizar las posiciones de las canciones restantes
    // La posición de las canciones que estaban por delante de la canción eliminada debe disminuir en 1
    await this.prisma.posicionCancion.updateMany({
      where: {
        IdLista: playlistId,
        Posicion: { gt: songPosition.Posicion },  // Usamos 'gt' para mayor que
      },
      data: {
        Posicion: { decrement: 1 },  // Reducimos la posición de las canciones siguientes
      },
    });
    
    //  Contar los géneros de las canciones en la playlist
    const positionSongs = await this.prisma.posicionCancion.findMany({
      where: {
        IdLista: playlistId,
      },
      include: {
        cancion: true, // Incluimos la información de las canciones
      },
    });

    const genreCount: Record<string, number> = {};

    // Contamos cuántas veces aparece cada género
    positionSongs.forEach(({ cancion }) => {
      const genre = cancion.Genero || "Sin genero"; // Si no tiene género, lo asignamos como "Sin genero"
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    //  Determinar el género predominante
    const predominantGenre = Object.keys(genreCount).reduce((prev, curr) => {
      return genreCount[curr] > genreCount[prev] ? curr : prev;
    });

    // Actualizar el género de la lista de reproducción
    await this.prisma.listaReproduccion.update({
      where: { Id: playlistId },
      data: {
        Genero: predominantGenre,
      },
    });
    return {
      message: 'Canción eliminada correctamente y las posiciones actualizadas. También se ha redefinido el género de la lista',
      predominantGenre: predominantGenre, // Mostramos el género predominante
    };
  }
}