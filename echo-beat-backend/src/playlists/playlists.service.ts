import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

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
   * Crea una nueva playlist y su correspondiente entrada en la tabla `ListaReproduccion`.
   * Combina ambos registros (en `Lista` y `ListaReproduccion`) respetando la relación 1:1.
   */
  async createPlaylist(createDto: { name: string; userId: string }) {
    // Primero se crea un registro en la tabla Lista
    const nuevaLista = await this.prisma.lista.create({
      data: {
        Nombre: createDto.name,
        Descripcion: 'Nueva playlist',
        Portada: '', // Ajusta si necesitas un valor por defecto
        TipoLista: 'Album', // 🔹 Agrega un valor válido para TipoLista
      },
    });

    // Luego, se enlaza la Lista recién creada con ListaReproduccion
    const nuevaReproduccion = await this.prisma.listaReproduccion.create({
      data: {
        Id: nuevaLista.Id, // Reutiliza el ID de la tabla Lista
        Nombre: createDto.name,
        EmailAutor: createDto.userId, // Referencia al usuario
      },
    });

    return {
      message: 'Playlist creada correctamente',
      lista: nuevaLista,
      listaReproduccion: nuevaReproduccion,
    };
  }

  /**
   * Elimina la playlist especificada (y su Lista asociada) por ID.
   * La eliminación en cascada borrará también la relación en ListaReproduccion.
   */
  async deletePlaylist(playlistId: string) {
    const idNum = Number(playlistId);

    // Verifica si existe la Lista
    const listaExistente = await this.prisma.lista.findUnique({
      where: { Id: idNum },
    });
    if (!listaExistente) {
      throw new NotFoundException('No se encontró la playlist con ese ID.');
    }

    // Elimina la Lista; la relación con ListaReproduccion se elimina por cascada
    await this.prisma.lista.delete({
      where: { Id: idNum },
    });

    return { message: 'Playlist eliminada correctamente' };
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
}