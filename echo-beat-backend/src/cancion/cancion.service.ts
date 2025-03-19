import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CancionService {
  constructor(private readonly prisma: PrismaService) {}

  async likeSong(email: string, songId: number) {
    try {
      return await this.prisma.cancionGuardada.create({
        data: {
          EmailUsuario: email,
          IdCancion: songId,
        },
      });
    } catch (error) {
      throw new BadRequestException('Error al guardar la canción.');
    }
  }

  async unlikeSong(email: string, songId: number) {
    try {
      return await this.prisma.cancionGuardada.delete({
        where: {
          EmailUsuario_IdCancion: {
            EmailUsuario: email,
            IdCancion: songId,
          },
        },
      });
    } catch (error) {
      throw new BadRequestException('Error al eliminar la canción de favoritos.');
    }
  }

  async getUserFavoriteSongs(email: string) {
    try {
      const cancionesGuardadas = await this.prisma.cancionGuardada.findMany({
        where: { EmailUsuario: email },
        include: {
          cancion: true,
        },
      });
      const canciones = cancionesGuardadas.map(({ cancion }) => ({
        id: cancion.Id,
        nombre: cancion.Nombre,
        duracion: cancion.Duracion,
        numReproducciones: cancion.NumReproducciones,
        numFavoritos: cancion.NumFavoritos,
        portada: cancion.Portada,
      }));

      return { canciones };
    } catch (error) {
      throw new BadRequestException('Error al obtener las canciones favoritas.');
    }
  }
}
