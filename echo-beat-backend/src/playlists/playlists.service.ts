import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
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
   * Obtiene el nombre de la primera canción en una playlist dada su ID.
   * @param playlistId ID de la playlist.
   * @returns Nombre de la primera canción o null si no se encuentra.
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

    return song ? song.Nombre : null;
  }

  /**
   * Obtiene el nombre de la siguiente canción en la playlist (segunda en orden).
   * @param playlistId ID de la playlist.
   * @returns Nombre de la siguiente canción o null si no se encuentra.
   */
  async getNextSongInPlaylist(playlistId: string): Promise<string | null> {
    const positions = await this.prisma.posicionCancion.findMany({
      where: { IdLista: Number(playlistId) },
      orderBy: { Posicion: 'asc' },
      skip: 1,
      take: 1,
    });

    if (positions.length === 0) {
      return null;
    }

    const nextSong = await this.prisma.cancion.findUnique({
      where: { Id: positions[0].IdCancion },
    });

    return nextSong ? nextSong.Nombre : null;
  }


  /**
   * Retorna todas las playlists creadas por un usuario junto con su información.
   * @param userEmail Correo del usuario.
   * @returns Listado de playlists o mensaje si no hay ninguna.
   */
  async findAllByUser(userEmail: string) {
    const playlists = await this.prisma.listaReproduccion.findMany({
      where: { EmailAutor: userEmail },
      include: {
        lista: true,
      },
    });

    if (!playlists.length) {
      return { message: 'El usuario no tiene playlists', playlists: [] };
    }

    return playlists;
  }

  /**
   * Obtiene todas las canciones de una lista de reproducción dada.
   * @param listId ID de la lista.
   * @returns Objeto con un array de canciones.
   */
  async getSongsByListId(listId: string) {
    const playlist = await this.prisma.lista.findUnique({
      where: { Id: Number(listId) },
      include: {
        posiciones: {
          include: { cancion: true },
          orderBy: { Posicion: 'asc' },
        }
      },
    });

    if (!playlist) {
      throw new NotFoundException(`No se encontró la playlist con ID ${listId}`);
    }

    const canciones = playlist.posiciones.map(posicion => ({
      id: posicion.cancion.Id,
      nombre: posicion.cancion.Nombre,
      duracion: posicion.cancion.Duracion,
      numReproducciones: posicion.cancion.NumReproducciones,
      numFavoritos: posicion.cancion.NumFavoritos,
      portada: posicion.cancion.Portada,
    }));

    return { canciones };
  }

  /**
 * Crea una nueva playlist con una imagen personalizada subida por el usuario.
 * @param emailUsuario Correo del usuario.
 * @param nombrePlaylist Nombre de la playlist.
 * @param descripcionPlaylist Descripción de la playlist.
 * @param tipoPrivacidad Privacidad de la playlist.
 * @param file Archivo de imagen subido.
 * @returns Mensaje de confirmación y datos de la playlist creada.
 */
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

    if (tipoPrivacidad != "privado" && tipoPrivacidad != "protegido" && tipoPrivacidad != "publico") {
      throw new BadRequestException('El tipo de privacidad debe ser "publico", "privado" o "protegido".');
    }

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

    const imageUrl = `${containerClient.url}/${newBlobName}`;

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

    await this.prisma.listaReproduccion.create({
      data: {
        Id: newPlaylist.Id,
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

  /**
 * Crea una nueva playlist usando una imagen predefinida.
 * @param emailUsuario Correo del usuario.
 * @param nombrePlaylist Nombre de la playlist.
 * @param descripcionPlaylist Descripción de la playlist.
 * @param tipoPrivacidad Privacidad de la playlist.
 * @param imageUrl URL de la imagen predefinida.
 * @returns Mensaje de éxito y datos de la nueva playlist.
 */
  async createPlaylistWithImageUrl(
    emailUsuario: string,
    nombrePlaylist: string,
    descripcionPlaylist: string,
    tipoPrivacidad: string,
    imageUrl: string
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { Email: emailUsuario },
    });

    if (!usuario) {
      throw new NotFoundException('No se encontró un usuario con ese correo.');
    }

    if (tipoPrivacidad != "privado" && tipoPrivacidad != "protegido" && tipoPrivacidad != "publico") {
      throw new BadRequestException('El tipo de privacidad debe ser "publico", "privado" o "protegido".');
    }

    const containerName = process.env.CONTAINER_DEFAULT_LIST_PHOTOS;
    if (!containerName) {
      throw new Error('La variable de entorno CONTAINER_DEFAULT_LIST_PHOTOS no está definida.');
    }

    if (!imageUrl.startsWith(`${process.env.AZURE_BLOB_URL}/${containerName}`)) {
      throw new BadRequestException('El enlace proporcionado no corresponde al contenedor correcto.');
    }

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

  /**
   * Elimina una playlist, su imagen, las canciones asociadas y referencias.
   * @param userEmail Correo del usuario.
   * @param playlistId ID de la playlist.
   * @returns Mensaje de éxito.
   */
  async deletePlaylist(userEmail: string, playlistId: number) {
    const playlist = await this.prisma.lista.findUnique({
      where: {
        Id: playlistId,
      },
      select: {
        Id: true,
        Portada: true,
      },
    });

    if (!playlist) {
      throw new NotFoundException('No se encontró la playlist con el ID proporcionado.');
    }

    const playlistReproduccion = await this.prisma.listaReproduccion.findUnique({
      where: {
        Id: playlistId,
      },
      select: {
        EmailAutor: true,
      },
    });

    if (!playlistReproduccion) {
      throw new NotFoundException('No se encontró la relación con la lista de reproducción.');
    }

    if (playlistReproduccion.EmailAutor !== userEmail) {
      throw new ForbiddenException('No eres el autor de la playlist. No puedes eliminarla.');
    }

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

    await this.prisma.posicionCancion.deleteMany({
      where: { IdLista: playlistId },
    });

    await this.prisma.listaReproduccion.delete({
      where: { Id: playlistId },
    });

    await this.prisma.lista.delete({
      where: { Id: playlistId },
    });

    await this.prisma.usuario.updateMany({
      where: { UltimaListaEscuchada: playlistId },
      data: { UltimaListaEscuchada: null },
    });

    return { message: 'Playlist eliminada correctamente' };
  }

  /**
 * Devuelve una lista con todas las URLs de imágenes predefinidas.
 * @returns Array de URLs de imágenes.
 */
  async getAllListDefaultImageUrls() {

    const containerName = process.env.CONTAINER_DEFAULT_LIST_PHOTOS;

    if (!containerName) {
      throw new Error('La variable de entorno CONTAINER_DEFAULT_LIST_PHOTOS no está definida.');
    }

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const imageUrls: string[] = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      const imageUrl = `${containerClient.url}/${blob.name}`;
      imageUrls.push(imageUrl);
    }

    return imageUrls;
  }

  /**
 * Añade una canción a una playlist.
 * @param playlistId ID de la playlist.
 * @param songId ID de la canción.
 * @returns Mensaje de éxito y posición de la canción añadida.
 */
  async addSongToPlaylist(playlistId: number, songId: number) {
    const playlist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('No se encontró la playlist con el ID proporcionado.');
    }

    const song = await this.prisma.cancion.findUnique({
      where: { Id: songId },
    });

    if (!song) {
      throw new NotFoundException('No se encontró la canción con el ID proporcionado.');
    }

    const lastPosition = await this.prisma.posicionCancion.aggregate({
      _max: {
        Posicion: true,
      },
      where: {
        IdLista: playlistId,
      },
    });

    const newPosition = lastPosition._max.Posicion ? lastPosition._max.Posicion + 1 : 1;

    await this.prisma.posicionCancion.create({
      data: {
        IdLista: playlistId,
        IdCancion: songId,
        Posicion: newPosition,
      },
    });

    const positionSongs = await this.prisma.posicionCancion.findMany({
      where: {
        IdLista: playlistId,
      },
      include: {
        cancion: true,
      },
    });

    const genreCount: Record<string, number> = {};

    positionSongs.forEach(({ cancion }) => {
      const genre = cancion.Genero || "Sin genero";
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    const predominantGenre = Object.keys(genreCount).reduce((prev, curr) => {
      return genreCount[curr] > genreCount[prev] ? curr : prev;
    });

    await this.prisma.listaReproduccion.update({
      where: { Id: playlistId },
      data: {
        Genero: predominantGenre,
      },
    });

    const totalSongs = positionSongs.length;

    const totalDuration = positionSongs.reduce((sum, { cancion }) => sum + (cancion.Duracion || 0), 0);

    await this.prisma.lista.update({
      where: { Id: playlistId },
      data: {
        NumCanciones: totalSongs,
        Duracion: totalDuration,
      },
    });

    return {
      message: 'Canción añadida a la playlist correctamente',
      position: newPosition,
      predominantGenre: predominantGenre,
    };
  }

  /**
 * Elimina una canción de una playlist y actualiza las posiciones restantes.
 * @param playlistId ID de la playlist.
 * @param songId ID de la canción.
 * @returns Mensaje y género actualizado.
 */
  async deleteSongFromPlaylist(playlistId: number, songId: number) {
    const playlist = await this.prisma.lista.findUnique({
      where: { Id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('No se encontró la lista de reproducción con el ID proporcionado.');
    }

    const song = await this.prisma.cancion.findUnique({
      where: { Id: songId },
    });

    if (!song) {
      throw new NotFoundException('No se encontró la canción con el ID proporcionado.');
    }

    const songPosition = await this.prisma.posicionCancion.findUnique({
      where: {
        IdLista_IdCancion: { IdLista: playlistId, IdCancion: songId },
      },
    });

    if (!songPosition) {
      throw new NotFoundException('La canción no se encuentra en la playlist.');
    }

    await this.prisma.posicionCancion.delete({
      where: {
        IdLista_IdCancion: { IdLista: playlistId, IdCancion: songId },
      },
    });

    await this.prisma.posicionCancion.updateMany({
      where: {
        IdLista: playlistId,
        Posicion: { gt: songPosition.Posicion },
      },
      data: {
        Posicion: { decrement: 1 },
      },
    });

    const positionSongs = await this.prisma.posicionCancion.findMany({
      where: {
        IdLista: playlistId,
      },
      include: {
        cancion: true,
      },
    });

    const genreCount: Record<string, number> = {};

    positionSongs.forEach(({ cancion }) => {
      const genre = cancion.Genero || "Sin genero";
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    let predominantGenre: string | null = null;

    if (positionSongs.length > 0) {
      predominantGenre = Object.keys(genreCount).reduce((prev, curr) => {
        return genreCount[curr] > genreCount[prev] ? curr : prev;
      });
    } else {
      predominantGenre = "Sin genero";
    }

    await this.prisma.listaReproduccion.update({
      where: { Id: playlistId },
      data: {
        Genero: predominantGenre,
      },
    });

    let totalSongs = positionSongs.length;
    let totalDuration = 0;

    if (totalSongs > 0) {
      totalDuration = positionSongs.reduce((sum, { cancion }) => sum + (cancion.Duracion || 0), 0);
    }

    await this.prisma.lista.update({
      where: { Id: playlistId },
      data: {
        NumCanciones: totalSongs,
        Duracion: totalDuration,
      },
    });

    return {
      message: 'Canción eliminada correctamente y las posiciones actualizadas. También se ha redefinido el género de la lista',
      predominantGenre: predominantGenre,
    };
  }

  /**
 * Devuelve los detalles básicos de una lista de reproducción.
 * @param idList ID de la lista.
 * @returns Detalles de la lista.
 */
  async getListDetails(idList: number) {
    const playlist = await this.prisma.lista.findUnique({
      where: {
        Id: idList,
      },
      select: {
        Nombre: true,
        NumCanciones: true,
        Duracion: true,
        NumLikes: true,
        Descripcion: true,
        Portada: true,
        TipoLista: true,
      },
    });

    if (!playlist) {
      throw new NotFoundException('No se encontró la playlist con la ID proporcionada.');
    }

    return playlist;
  }

  /**
 * Devuelve los detalles de un álbum incluyendo autor, portada y estadísticas.
 * @param idLista ID del álbum.
 * @returns Objeto con los detalles del álbum.
 */
  async getAlbumDetails(idLista: number) {
    const album = await this.prisma.album.findUnique({
      where: {
        Id: idLista,
      },
      include: {
        lista: {
          select: {
            Nombre: true,
            NumCanciones: true,
            NumLikes: true,
            Portada: true,
          },
        },
        autores: {
          include: {
            artista: {
              select: {
                Nombre: true,
              },
            },
          },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('No se encontró el álbum con la ID proporcionada.');
    }

    return {
      id: album.Id,
      nombre: album.lista.Nombre,
      autor: album.autores.length > 0 ? album.autores[0].artista.Nombre : null,
      numCanciones: album.lista.NumCanciones,
      numLikes: album.lista.NumLikes,
      numReproducciones: album.NumReproducciones,
      portada: album.lista.Portada,
      fechaLanzamiento: album.FechaLanzamiento,
    };
  }

  /**
   * Devuelve los detalles de privacidad y género de una playlist.
   * @param idPlaylist ID de la playlist.
   * @returns Objeto con la privacidad y género.
   */
  async getPlaylistDetails(idPlaylist: number) {
    const playlist = await this.prisma.listaReproduccion.findUnique({
      where: {
        Id: idPlaylist,
      },
      select: {
        TipoPrivacidad: true,
        Genero: true,
        EmailAutor: true,
        autor: {
          select: {
            Nick: true,
            Privacidad: true,
          },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException('No se encontró la playlist con la ID proporcionada.');
    }

    return {
      TipoPrivacidad: playlist.TipoPrivacidad,
      Genero: playlist.Genero,
      EmailAutor: playlist.EmailAutor,
      Autor: playlist.autor,
    };
  }



  /**
   * Actualiza la portada de una playlist desde una imagen por defecto.
   * @param userEmail Correo del usuario.
   * @param playlistId ID de la playlist.
   * @param imageUrl URL de la nueva portada.
   * @returns Mensaje de éxito.
   */
  async updatePlaylistCover(userEmail: string, playlistId: number, imageUrl: string) {
    const containerNameDefault = process.env.CONTAINER_DEFAULT_LIST_PHOTOS;
    if (!containerNameDefault) {
      throw new BadRequestException('El contenedor de imágenes predefinidas no está definido en las variables de entorno.');
    }

    const containerName = process.env.CONTAINER_LIST_PHOTOS;
    if (!containerName) {
      throw new BadRequestException('El contenedor de imágenes no está definido en las variables de entorno.');
    }

    if (!imageUrl.startsWith(`${process.env.AZURE_BLOB_URL}/${containerNameDefault}`)) {
      throw new BadRequestException('El enlace proporcionado no corresponde al contenedor correcto.');
    }

    const imageName = imageUrl.split('/').pop();

    if (!imageName) {
      throw new BadRequestException('No se pudo extraer el nombre de la imagen del enlace.');
    }

    const containerClient = this.blobServiceClient.getContainerClient(containerNameDefault);
    const blobClient = containerClient.getBlobClient(imageName);

    const exists = await blobClient.exists();
    if (!exists) {
      throw new NotFoundException('La imagen no existe en el contenedor de Blob Storage.');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { Email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('No se encontró el usuario.');
    }

    const playlist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: playlistId },
      include: { lista: true },
    });

    if (!playlist) {
      throw new NotFoundException('No se encontró la playlist asociada al ID proporcionado.');
    }

    if (playlist.EmailAutor !== userEmail) {
      throw new ForbiddenException('El usuario no es el autor de esta playlist.');
    }

    if (playlist.lista.Portada) {
      const previousImageName = playlist.lista.Portada.split('/').pop();
      if (previousImageName && previousImageName !== imageName) {
        const previousContainerClient = this.blobServiceClient.getContainerClient(containerName);
        const previousBlobClient = previousContainerClient.getBlobClient(previousImageName);
        const previousExists = await previousBlobClient.exists();
        if (previousExists) {
          await previousBlobClient.deleteIfExists();
        }
      }
    }

    await this.prisma.lista.update({
      where: { Id: playlistId },
      data: { Portada: imageUrl },
    });

    return {
      message: 'Portada de la playlist actualizada correctamente',
    };
  }

  /**
 * Actualiza la portada de una playlist subiendo una imagen nueva.
 * @param idLista ID de la playlist.
 * @param file Imagen subida.
 * @param userEmail Correo del usuario.
 * @returns Mensaje de éxito y URL nueva.
 */
  async updatePlaylistPhoto(idLista: number, file: Express.Multer.File, userEmail: string) {
    const lista = await this.prisma.lista.findUnique({
      where: { Id: idLista },
      select: { Portada: true },
    });

    if (!lista) {
      throw new NotFoundException('Lista no encontrada');
    }

    const playlist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: idLista },
    });

    if (!playlist) {
      throw new NotFoundException('La lista no es una playlist');
    }

    if (playlist.EmailAutor !== userEmail) {
      throw new ForbiddenException('No tienes permisos para actualizar esta playlist');
    }

    const containerName = process.env.CONTAINER_LIST_PHOTOS;

    if (!containerName) {
      throw new Error('La variable de entorno CONTAINER_LIST_PHOTOS no está definida.');
    }

    if (lista.Portada) {
      const oldPhotoUrl = lista.Portada;
      const oldBlobName = oldPhotoUrl.split('/').pop();
      if (oldBlobName) {
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(oldBlobName);
        await blobClient.deleteIfExists();
      }
    }

    const newBlobName = `${uuidv4()}-${file.originalname}`;

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(newBlobName);
    await blobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const uploadedPhotoUrl = `${containerClient.url}/${newBlobName}`;

    await this.prisma.lista.update({
      where: { Id: idLista },
      data: { Portada: uploadedPhotoUrl },
    });

    return { message: 'Foto actualizada correctamente', newPhotoUrl: uploadedPhotoUrl };
  }

  /**
   * Obtiene el nombre de una canción por su ID.
   * @param songId ID de la canción.
   * @returns Nombre de la canción o null.
   */
  async getSongName(songId: number): Promise<string | null> {

    const songName = await this.prisma.cancion.findUnique({
      where: { Id: songId },
    });

    return songName ? songName.Nombre : null;
  }

  /**
 * Obtiene la duración de una canción.
 * @param songId ID de la canción.
 * @returns Duración en segundos.
 */
  async getSongLength(songId: number): Promise<number> {

    const songName = await this.prisma.cancion.findUnique({
      where: { Id: songId },
    });

    return songName ? songName.Duracion : 0;
  }

  /**
 * Devuelve las playlists que un usuario ha marcado con like.
 * @param email Correo del usuario.
 * @returns Array de listas favoritas.
 */
  async getLikedListsByUser(email: string) {
    const likedLists = await this.prisma.like.findMany({
      where: {
        EmailUsuario: email,
        tieneLike: true,
      },
      include: {
        lista: true,
      },
    });

    return likedLists.map((like) => like.lista);
  }

  /**
 * Da like a una playlist.
 * @param email Correo del usuario.
 * @param idLista ID de la playlist.
 * @returns Mensaje de confirmación.
 */
  async addLikeToPlaylist(email: string, idLista: number) {
    const user = await this.prisma.usuario.findUnique({ where: { Email: email } });

    const playlistId = parseInt(idLista.toString(), 10);

    if (isNaN(playlistId)) {
      throw new Error('ID de lista inválido');
    }

    const playlist = await this.prisma.lista.findUnique({
      where: {
        Id: playlistId,
      },
    });

    if (!user || !playlist) {
      throw new NotFoundException('Usuario o lista no encontrados');
    }

    const like = await this.prisma.like.upsert({
      where: {
        EmailUsuario_IdLista: {
          EmailUsuario: email,
          IdLista: playlistId
        }
      },
      update: { tieneLike: true },
      create: {
        EmailUsuario: email,
        IdLista: playlistId,
        tieneLike: true,
      },
    });

    await this.prisma.lista.update({
      where: { Id: playlistId },
      data: { NumLikes: { increment: 1 } },
    });

    return { message: 'Like agregado a la lista' };
  }

  /**
 * Elimina el like de una playlist.
 * @param email Correo del usuario.
 * @param idLista ID de la playlist.
 * @returns Mensaje de confirmación.
 */
  async removeLikeFromPlaylist(email: string, idLista: number) {
    const user = await this.prisma.usuario.findUnique({ where: { Email: email } });

    const playlistId = parseInt(idLista.toString(), 10);

    if (isNaN(playlistId)) {
      throw new Error('ID de lista inválido');
    }

    const playlist = await this.prisma.lista.findUnique({
      where: {
        Id: playlistId,
      },
    });

    if (!user || !playlist) {
      throw new NotFoundException('Usuario o lista no encontrados');
    }

    const like = await this.prisma.like.findUnique({
      where: { EmailUsuario_IdLista: { EmailUsuario: email, IdLista: playlistId } },
    });

    if (!like) {
      throw new NotFoundException('No se encontró el like en esta lista');
    }

    await this.prisma.like.delete({
      where: { EmailUsuario_IdLista: { EmailUsuario: email, IdLista: playlistId } },
    });

    await this.prisma.lista.update({
      where: { Id: playlistId },
      data: { NumLikes: { decrement: 1 } },
    });

    return { message: 'Like quitado de la lista' };
  }

  /**
 * Devuelve detalles de una canción y sus autores.
 * @param idCancion ID de la canción.
 * @returns Objeto con información de la canción.
 */
  async getSongDetailsWithAuthors(idCancion: number) {
    const song = await this.prisma.cancion.findUnique({
      where: { Id: idCancion },
      select: {
        Nombre: true,
        Duracion: true,
        Portada: true,
      },
    });

    if (!song) {
      throw new NotFoundException('No se encontró la canción con el ID proporcionado.');
    }

    const authors = await this.prisma.autorCancion.findMany({
      where: { IdCancion: idCancion },
      select: { NombreArtista: true },
    });

    return {
      Nombre: song.Nombre,
      Duracion: song.Duracion,
      Portada: song.Portada,
      Autores: authors.map(author => author.NombreArtista),
    };
  }

  /**
   * Incrementa el contador de reproducciones para canción, álbum y autores.
   * @param songIdQuizas ID de la canción.
   * @returns Mensaje de éxito.
   */
  async incrementSongAlbumAndAuthorPlays(songIdQuizas: number) {
    const songId = typeof songIdQuizas === 'string' ? parseInt(songIdQuizas, 10) : songIdQuizas;

    const song = await this.prisma.cancion.update({
      where: { Id: songId },
      data: { NumReproducciones: { increment: 1 } },
      select: { Id: true },
    });
    if (!song) throw new NotFoundException('Canción no encontrada');

    const album = await this.prisma.posicionCancion.findMany({
      where: {
        IdCancion: songId,
        lista: { TipoLista: 'Album' },
      },
      select: { IdLista: true },
    });
    if (!song) throw new NotFoundException('Canción no encontrada');

    await this.prisma.album.update({
      where: { Id: album[0].IdLista },
      data: { NumReproducciones: { increment: 1 } },
      select: { Id: true },
    });
    if (!song) throw new NotFoundException('Canción no encontrada');

    const authors = await this.prisma.autorCancion.findMany({
      where: { IdCancion: song.Id },
      select: { NombreArtista: true },
    });
    for (const autor of authors) {
      await this.prisma.artista.updateMany({
        where: { Nombre: autor.NombreArtista },
        data: { NumOyentesTotales: { increment: 1 } },
      });
    }

    return { message: 'Reproducciones actualizadas correctamente' };
  }

  /**
 * Reordena canciones en una playlist desde un JSON recibido.
 * @param idPlaylist ID de la playlist.
 * @param cancionesJson Objeto con el nuevo orden.
 * @returns Mensaje de éxito.
 */
  async reordenarCancionesDePlaylist(idPlaylist: number, cancionesJson: any) {
    const playlist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: idPlaylist },
    });

    if (!playlist) {
      throw new NotFoundException('La playlist no existe.');
    }

    if (!cancionesJson || typeof cancionesJson !== 'object' || !Array.isArray(cancionesJson.canciones)) {
      throw new BadRequestException('El formato de la cola de reproducción no es válido.');
    }

    const canciones = cancionesJson.canciones;

    for (const cancion of canciones) {
      if (
        typeof cancion.id !== 'number' ||
        typeof cancion.nombre !== 'string' ||
        typeof cancion.duracion !== 'number' ||
        typeof cancion.numReproducciones !== 'number' ||
        typeof cancion.numFavoritos !== 'number' ||
        typeof cancion.portada !== 'string'
      ) {
        throw new BadRequestException('Una o más canciones tienen un formato inválido.');
      }
    }
    await this.prisma.posicionCancion.deleteMany({
      where: { IdLista: idPlaylist },
    });

    for (let i = 0; i < canciones.length; i++) {
      const cancion = canciones[i];
      await this.prisma.posicionCancion.create({
        data: {
          IdLista: idPlaylist,
          IdCancion: cancion.id,
          Posicion: i,
        },
      });
    }

    return {
      message: 'Orden de canciones actualizado correctamente',
    };
  }

  /**
 * Ordena canciones de una playlist por tipo (alfabético, reproducciones, etc).
 * @param idPlaylist ID de la playlist.
 * @param tipoFiltro Tipo de orden.
 * @returns Array ordenado de canciones.
 */
  async ordenarCancionesDePlaylist(idPlaylist: number, tipoFiltro: number) {
    const cancionesJson = await this.getSongsByListId(String(idPlaylist));

    if (!Array.isArray(cancionesJson.canciones)) {
      throw new Error('Formato incorrecto de canciones');
    }

    let canciones = cancionesJson.canciones;

    switch (tipoFiltro) {
      case 0:
        break;

      case 1:
        canciones.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;

      case 2:
        canciones.sort((a, b) => b.numReproducciones - a.numReproducciones);
        break;
      default:
        throw new Error('Tipo de filtro inválido');
    }

    return { canciones };
  }

  /**
 * Actualiza el nombre de una playlist.
 * @param userEmail Correo del autor.
 * @param idPlaylist ID de la playlist.
 * @param newName Nuevo nombre.
 * @returns Mensaje de éxito.
 */
  async updatePlaylistName(userEmail: string, idPlaylist: number, newName: string) {
    const playlist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: idPlaylist },
    });

    if (!playlist || playlist.EmailAutor !== userEmail) {
      throw new ForbiddenException('No tienes permiso para modificar esta playlist.');
    }

    await this.prisma.lista.update({
      where: { Id: idPlaylist },
      data: { Nombre: newName },
    });

    await this.prisma.listaReproduccion.update({
      where: { Id: idPlaylist },
      data: { Nombre: newName },
    });


    return { message: 'Nombre de la playlist actualizado correctamente' };
  }

  /**
 * Actualiza la descripción de una playlist.
 * @param userEmail Correo del autor.
 * @param idPlaylist ID de la playlist.
 * @param newDescription Nueva descripción.
 * @returns Mensaje de éxito.
 */
  async updatePlaylistDescription(userEmail: string, idPlaylist: number, newDescription: string) {
    const playlist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: idPlaylist },
    });

    if (!playlist || playlist.EmailAutor !== userEmail) {
      throw new ForbiddenException('No tienes permiso para modificar esta playlist.');
    }

    await this.prisma.lista.update({
      where: { Id: idPlaylist },
      data: { Descripcion: newDescription },
    });

    return { message: 'Descripción de la playlist actualizada correctamente' };
  }


  /**
   * Actualiza la privacidad de una playlist.
   * @param userEmail Correo del autor.
   * @param idPlaylist ID de la playlist.
   * @param tipoPrivacidad Nuevo valor de privacidad.
   * @returns Mensaje de éxito.
   */
  async updatePlaylistPrivacy(userEmail: string, idPlaylist: number, tipoPrivacidad: string) {
    const tiposValidos = ['publico', 'privado', 'protegido'];

    if (!tiposValidos.includes(tipoPrivacidad)) {
      throw new BadRequestException('Tipo de privacidad inválido. Debe ser "publico", "privado" o "protegido".');
    }

    const playlist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: idPlaylist },
    });

    if (!playlist || playlist.EmailAutor !== userEmail) {
      throw new ForbiddenException('No tienes permiso para modificar esta playlist.');
    }

    await this.prisma.listaReproduccion.update({
      where: { Id: idPlaylist },
      data: { TipoPrivacidad: tipoPrivacidad },
    });

    return { message: 'Privacidad de la playlist actualizada correctamente' };
  }

}