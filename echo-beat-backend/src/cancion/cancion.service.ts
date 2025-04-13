import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CancionService {
  constructor(private readonly prisma: PrismaService) { }

  /**
 * Añade una canción a los favoritos del usuario.
 * Incrementa el contador de favoritos de la canción.
 *
 * @param email - Correo electrónico del usuario.
 * @param songId - ID de la canción a guardar.
 * @returns La entrada creada en la tabla de canciones guardadas.
 */
  async likeSong(email: string, songId: number) {
    try {
      const result = await this.prisma.cancionGuardada.create({
        data: {
          EmailUsuario: email,
          IdCancion: songId,
        },
      });

      await this.prisma.cancion.update({
        where: { Id: songId },
        data: {
          NumFavoritos: {
            increment: 1,
          },
        },
      });

      return result;
    } catch (error) {
      throw new BadRequestException('Error al guardar la canción.');
    }
  }

  /**
   * Elimina una canción de los favoritos del usuario.
   * Decrementa el contador de favoritos de la canción.
   *
   * @param email - Correo electrónico del usuario.
   * @param songId - ID de la canción a eliminar de favoritos.
   * @returns La entrada eliminada de la tabla de canciones guardadas.
   */
  async unlikeSong(email: string, songId: number) {
    try {
      const result = await this.prisma.cancionGuardada.delete({
        where: {
          EmailUsuario_IdCancion: {
            EmailUsuario: email,
            IdCancion: songId,
          },
        },
      });

      await this.prisma.cancion.update({
        where: { Id: songId },
        data: {
          NumFavoritos: {
            decrement: 1,
          },
        },
      });

      return result;
    } catch (error) {
      throw new BadRequestException('Error al eliminar la canción de favoritos.');
    }
  }

  /**
   * Obtiene todas las canciones favoritas de un usuario.
   *
   * @param email - Correo electrónico del usuario.
   * @returns Un objeto que contiene un array de canciones favoritas con sus detalles.
   */
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
