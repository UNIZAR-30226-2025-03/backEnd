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

  async deleteUser(email: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { Email: email },
    });
    if (!user) {
      throw new NotFoundException(`El usuario con correo ${email} no existe`);
    }

    await this.prisma.usuario.delete({
      where: { Email: email },
    });

    return { message: `Usuario con correo ${email} eliminado correctamente.` };
  }

  async getAllUsers() {
    const users = await this.prisma.usuario.findMany({
      where: { Email: { not: ADMIN_EMAIL } },
    });

    if (users.length === 0) {
      throw new NotFoundException('No se encontraron usuarios.');
    }

    return users.map(user => ({
      id: user.Email,
      email: user.Email,
      name: user.NombreCompleto,
      birthDate: user.FechaNacimiento,
    }));
  }
}