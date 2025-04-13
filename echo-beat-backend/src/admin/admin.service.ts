import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

class CreatePlaylistDto {
  name: string;
  description: string;
  isPublic: boolean;
}

class UpdatePlaylistDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

const ADMIN_EMAIL = "admin";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }
  /**
   * Obtiene todas las playlists predefinidas creadas por el administrador.
   * 
   * @returns Lista de playlists predefinidas con sus canciones ordenadas.
   */
  async findAllPredefinedPlaylists() {
    const predefinedPlaylists = await this.prisma.listaReproduccion.findMany({
      where: { EmailAutor: ADMIN_EMAIL },
      include: {
        lista: {
          include: {
            posiciones: {
              include: {
                cancion: true,
              },
              orderBy: {
                Posicion: 'asc',
              },
            },
          },
        },
      },
    });

    return predefinedPlaylists.map(playlist => ({
      id: playlist.Id,
      name: playlist.Nombre,
      description: playlist.lista.Descripcion,
      privacy: playlist.TipoPrivacidad,
      genre: playlist.Genero,
      coverImage: playlist.lista.Portada,
      totalSongs: playlist.lista.NumCanciones,
      duration: playlist.lista.Duracion,
      likes: playlist.lista.NumLikes,
      songs: playlist.lista.posiciones.map(pos => ({
        id: pos.cancion.Id,
        name: pos.cancion.Nombre,
        duration: pos.cancion.Duracion,
        position: pos.Posicion,
        coverImage: pos.cancion.Portada
      }))
    }));
  }

  /**
   * Crea una nueva playlist predefinida con los datos proporcionados.
   * 
   * @param createDto - Objeto con nombre, descripción y privacidad de la playlist.
   * @returns Objeto con los detalles de la playlist creada.
   */
  async createPredefinedPlaylist(createDto: CreatePlaylistDto) {
    const newLista = await this.prisma.lista.create({
      data: {
        Nombre: createDto.name,
        Descripcion: createDto.description,
        Portada: "https://adminpsoft.blob.core.windows.net/portadaspsoft/default_playlist.jpg",
        TipoLista: "predefinida",
        NumCanciones: 0,
        Duracion: 0,
        NumLikes: 0,
      }
    });

    const newPlaylist = await this.prisma.listaReproduccion.create({
      data: {
        Id: newLista.Id,
        Nombre: createDto.name,
        TipoPrivacidad: createDto.isPublic ? "publico" : "privado",
        EmailAutor: ADMIN_EMAIL,
        Genero: "Variado",
      },
      include: {
        lista: true
      }
    });

    return {
      id: newPlaylist.Id,
      name: newPlaylist.Nombre,
      description: newLista.Descripcion,
      privacy: newPlaylist.TipoPrivacidad,
      coverImage: newLista.Portada,
      songs: []
    };
  }

  /**
   * Actualiza una playlist predefinida existente.
   * 
   * @param id - ID de la playlist a actualizar.
   * @param updateDto - Objeto con los nuevos datos de nombre, descripción o privacidad.
   * @returns Objeto con los datos actualizados de la playlist.
   */
  async updatePredefinedPlaylist(id: number, updateDto: UpdatePlaylistDto) {
    const existingPlaylist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: id },
      include: { lista: true }
    });

    if (!existingPlaylist || existingPlaylist.EmailAutor !== ADMIN_EMAIL) {
      throw new NotFoundException(`Lista con ID ${id} no encontrada o no pertenece al administrador`);
    }

    const updatedPlaylist = await this.prisma.$transaction(async (tx) => {
      if (updateDto.name || updateDto.description) {
        await tx.lista.update({
          where: { Id: id },
          data: {
            ...(updateDto.name && { Nombre: updateDto.name }),
            ...(updateDto.description && { Descripcion: updateDto.description }),
          }
        });
      }

      return tx.listaReproduccion.update({
        where: { Id: id },
        data: {
          ...(updateDto.name && { Nombre: updateDto.name }),
          ...(updateDto.isPublic !== undefined && {
            TipoPrivacidad: updateDto.isPublic ? "publico" : "privado"
          }),
        },
        include: {
          lista: true
        }
      });
    });

    return {
      id: updatedPlaylist.Id,
      name: updatedPlaylist.Nombre,
      description: updatedPlaylist.lista.Descripcion,
      privacy: updatedPlaylist.TipoPrivacidad
    };
  }

  /**
   * Elimina una playlist predefinida y sus canciones asociadas.
   * 
   * @param id - ID de la playlist a eliminar.
   * @returns Mensaje de éxito tras la eliminación.
   */
  async deletePredefinedPlaylist(id: number) {
    const existingPlaylist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: id }
    });

    if (!existingPlaylist || existingPlaylist.EmailAutor !== ADMIN_EMAIL) {
      throw new NotFoundException(`Lista con ID ${id} no encontrada o no pertenece al administrador`);
    }

    await this.prisma.posicionCancion.deleteMany({
      where: { IdLista: id }
    });

    await this.prisma.lista.delete({
      where: { Id: id }
    });

    return { success: true, message: `Lista con ID ${id} eliminada correctamente` };
  }

  /**
   * Añade una canción a una playlist predefinida del administrador.
   * 
   * @param id - ID de la playlist.
   * @param songId - ID de la canción a añadir.
   * @returns Detalles de la canción añadida con su nueva posición.
   */
  async addSongToPlaylist(id: number, songId: number) {
    const existingPlaylist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: id },
      include: { lista: true }
    });

    if (!existingPlaylist || existingPlaylist.EmailAutor !== ADMIN_EMAIL) {
      throw new NotFoundException(`Lista con ID ${id} no encontrada o no pertenece al administrador`);
    }

    const song = await this.prisma.cancion.findUnique({
      where: { Id: songId }
    });

    if (!song) {
      throw new NotFoundException(`Canción con ID ${songId} no encontrada`);
    }

    const existingSongInPlaylist = await this.prisma.posicionCancion.findUnique({
      where: {
        IdLista_IdCancion: {
          IdLista: id,
          IdCancion: songId
        }
      }
    });

    if (existingSongInPlaylist) {
      throw new BadRequestException(`La canción ya está en la lista`);
    }

    const lastPosition = await this.prisma.posicionCancion.findFirst({
      where: { IdLista: id },
      orderBy: { Posicion: 'desc' }
    });

    const nextPosition = lastPosition ? lastPosition.Posicion + 1 : 1;

    const songAdded = await this.prisma.$transaction(async (tx) => {
      const position = await tx.posicionCancion.create({
        data: {
          IdLista: id,
          IdCancion: songId,
          Posicion: nextPosition
        },
        include: {
          cancion: true
        }
      });

      await tx.lista.update({
        where: { Id: id },
        data: {
          NumCanciones: { increment: 1 },
          Duracion: { increment: song.Duracion }
        }
      });

      return position;
    });

    return {
      playlistId: id,
      song: {
        id: songAdded.cancion.Id,
        name: songAdded.cancion.Nombre,
        position: songAdded.Posicion,
        duration: songAdded.cancion.Duracion
      }
    };
  }

  /**
   * Elimina una canción de una playlist predefinida.
   * 
   * @param id - ID de la playlist.
   * @param songId - ID de la canción a eliminar.
   * @returns Mensaje de éxito indicando que la canción fue eliminada.
   */
  async removeSongFromPlaylist(id: number, songId: number) {
    const existingPlaylist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: id },
      include: { lista: true }
    });

    if (!existingPlaylist || existingPlaylist.EmailAutor !== ADMIN_EMAIL) {
      throw new NotFoundException(`Lista con ID ${id} no encontrada o no pertenece al administrador`);
    }

    const songInPlaylist = await this.prisma.posicionCancion.findUnique({
      where: {
        IdLista_IdCancion: {
          IdLista: id,
          IdCancion: songId
        }
      },
      include: {
        cancion: true
      }
    });

    if (!songInPlaylist) {
      throw new NotFoundException(`Canción con ID ${songId} no encontrada en la lista`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.posicionCancion.delete({
        where: {
          IdLista_IdCancion: {
            IdLista: id,
            IdCancion: songId
          }
        }
      });

      const remainingSongs = await tx.posicionCancion.findMany({
        where: {
          IdLista: id,
          Posicion: { gt: songInPlaylist.Posicion }
        },
        orderBy: { Posicion: 'asc' }
      });

      for (const song of remainingSongs) {
        await tx.posicionCancion.update({
          where: {
            IdLista_IdCancion: {
              IdLista: id,
              IdCancion: song.IdCancion
            }
          },
          data: {
            Posicion: { decrement: 1 }
          }
        });
      }

      await tx.lista.update({
        where: { Id: id },
        data: {
          NumCanciones: { decrement: 1 },
          Duracion: { decrement: songInPlaylist.cancion.Duracion }
        }
      });
    });

    return {
      success: true,
      message: `Canción con ID ${songId} eliminada de la lista ${id}`
    };
  }
}