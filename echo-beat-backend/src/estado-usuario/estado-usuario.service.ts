import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EstadoUsuarioService {
  constructor(private readonly prisma: PrismaService) { }

  /**
 * Guarda la última canción escuchada por un usuario, reiniciando el minuto de escucha a 0.
 * Si ya existe un registro, lo actualiza. Si no, lo crea.
 *
 * @param Email Correo electrónico del usuario.
 * @param songId ID de la canción que el usuario comenzó a escuchar.
 * @returns El registro actualizado o creado de la canción escuchada por el usuario.
 */
  async storeLastSong(Email: string, songId: number) {
    const user = await this.prisma.cancionEscuchando.upsert({
      where: {
        EmailUsuario: Email
      },
      update: {
        IdCancion: songId, MinutoEscucha: 0
      },
      create: {
        EmailUsuario: Email, IdCancion: songId, MinutoEscucha: 0
      },

    });

    if (!user) {
      throw new Error(`Usuario con email ${Email} no encontrado.`);
    }

    return user;
  }

  /**
 * Actualiza el tiempo de reproducción actual de una canción para un usuario.
 * Si no existe un registro previo, lo crea.
 *
 * @param email Correo electrónico del usuario.
 * @param songId ID de la canción que el usuario está escuchando.
 * @param currentTime Tiempo actual de escucha en segundos.
 * @returns El registro actualizado o creado de la canción escuchada por el usuario.
 */
  async updateSongTime(email: string, songId: number, currentTime: number) {
    // Usamos upsert si tu tabla se llama "CancionEscuchando"
    // y la clave primaria  es [EmailUsuario].
    return this.prisma.cancionEscuchando.upsert({
      where: {
        EmailUsuario: email
      },
      update: {
        MinutoEscucha: currentTime,
      },
      create: {
        EmailUsuario: email,
        IdCancion: songId,
        MinutoEscucha: currentTime,
      },
    });
  }

}
