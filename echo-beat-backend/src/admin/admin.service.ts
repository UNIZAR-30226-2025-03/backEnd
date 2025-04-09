import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// DTOs correspondientes a los del controller
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
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene todas las listas de reproducción predefinidas (del admin)
   */
  async findAllPredefinedPlaylists() {
    // Buscar todas las listas de reproducción donde el autor es el admin
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

    // Transformar los resultados para devolver un formato más amigable
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
   * Crea una nueva lista de reproducción predefinida administrada por el sistema
   */
  async createPredefinedPlaylist(createDto: CreatePlaylistDto) {
    // Primero creamos el registro en la tabla Lista
    const newLista = await this.prisma.lista.create({
      data: {
        Nombre: createDto.name,
        Descripcion: createDto.description,
        Portada: "https://adminpsoft.blob.core.windows.net/portadaspsoft/default_playlist.jpg", // Imagen por defecto
        TipoLista: "predefinida",
        NumCanciones: 0,
        Duracion: 0,
        NumLikes: 0,
      }
    });

    // Luego creamos la ListaReproduccion asociada a esa Lista
    const newPlaylist = await this.prisma.listaReproduccion.create({
      data: {
        Id: newLista.Id,
        Nombre: createDto.name,
        TipoPrivacidad: createDto.isPublic ? "publico" : "privado",
        EmailAutor: ADMIN_EMAIL, // Asignamos el admin como autor
        Genero: "Variado", // Género por defecto
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
   * Actualiza una lista de reproducción predefinida
   */
  async updatePredefinedPlaylist(id: number, updateDto: UpdatePlaylistDto) {
    // Verificar que la lista existe y pertenece al admin
    const existingPlaylist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: id },
      include: { lista: true }
    });

    if (!existingPlaylist || existingPlaylist.EmailAutor !== ADMIN_EMAIL) {
      throw new NotFoundException(`Lista con ID ${id} no encontrada o no pertenece al administrador`);
    }

    // Actualizar la lista de reproducción y la lista asociada
    const updatedPlaylist = await this.prisma.$transaction(async (tx) => {
      // Actualizar datos en la tabla Lista
      if (updateDto.name || updateDto.description) {
        await tx.lista.update({
          where: { Id: id },
          data: {
            ...(updateDto.name && { Nombre: updateDto.name }),
            ...(updateDto.description && { Descripcion: updateDto.description }),
          }
        });
      }

      // Actualizar datos en ListaReproduccion
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
   * Elimina una lista de reproducción predefinida
   */
  async deletePredefinedPlaylist(id: number) {
    // Verificar que la lista existe y pertenece al admin
    const existingPlaylist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: id }
    });

    if (!existingPlaylist || existingPlaylist.EmailAutor !== ADMIN_EMAIL) {
      throw new NotFoundException(`Lista con ID ${id} no encontrada o no pertenece al administrador`);
    }

    // Eliminamos primero las canciones de la lista
    await this.prisma.posicionCancion.deleteMany({
      where: { IdLista: id }
    });

    // Debido a la relación de cascada, al eliminar la Lista también se elimina ListaReproduccion
    await this.prisma.lista.delete({
      where: { Id: id }
    });

    return { success: true, message: `Lista con ID ${id} eliminada correctamente` };
  }

  /**
   * Añade una canción a una lista de reproducción predefinida
   */
  async addSongToPlaylist(id: number, songId: number) {
    // Verificar que la lista existe y pertenece al admin
    const existingPlaylist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: id },
      include: { lista: true }
    });

    if (!existingPlaylist || existingPlaylist.EmailAutor !== ADMIN_EMAIL) {
      throw new NotFoundException(`Lista con ID ${id} no encontrada o no pertenece al administrador`);
    }

    // Verificar que la canción existe
    const song = await this.prisma.cancion.findUnique({
      where: { Id: songId }
    });

    if (!song) {
      throw new NotFoundException(`Canción con ID ${songId} no encontrada`);
    }

    // Verificar si la canción ya está en la lista
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

    // Determinar la próxima posición en la lista
    const lastPosition = await this.prisma.posicionCancion.findFirst({
      where: { IdLista: id },
      orderBy: { Posicion: 'desc' }
    });

    const nextPosition = lastPosition ? lastPosition.Posicion + 1 : 1;

    // Añadir la canción a la lista
    const songAdded = await this.prisma.$transaction(async (tx) => {
      // Añadir la canción con su posición
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

      // Actualizar número de canciones y duración de la lista
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
   * Elimina una canción de una lista de reproducción predefinida
   */
  async removeSongFromPlaylist(id: number, songId: number) {
    // Verificar que la lista existe y pertenece al admin
    const existingPlaylist = await this.prisma.listaReproduccion.findUnique({
      where: { Id: id },
      include: { lista: true }
    });

    if (!existingPlaylist || existingPlaylist.EmailAutor !== ADMIN_EMAIL) {
      throw new NotFoundException(`Lista con ID ${id} no encontrada o no pertenece al administrador`);
    }

    // Verificar que la canción está en la lista
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

    // Eliminar la canción y actualizar la lista
    await this.prisma.$transaction(async (tx) => {
      // Eliminar la canción de la lista
      await tx.posicionCancion.delete({
        where: {
          IdLista_IdCancion: {
            IdLista: id,
            IdCancion: songId
          }
        }
      });

      // Reorganizar las posiciones de las canciones restantes
      const remainingSongs = await tx.posicionCancion.findMany({
        where: { 
          IdLista: id,
          Posicion: { gt: songInPlaylist.Posicion }
        },
        orderBy: { Posicion: 'asc' }
      });

      // Actualizar posiciones
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

      // Actualizar número de canciones y duración de la lista
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