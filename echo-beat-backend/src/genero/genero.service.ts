import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Asegúrate de tener PrismaService

@Injectable()
export class GeneroService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Obtiene todos los géneros asociados a un usuario, junto con su foto y la ID de la playlist si existe.
   *
   * @param userEmail Correo electrónico del usuario.
   * @returns Promesa con un array de objetos que contienen el nombre del género, la foto y el ID de la playlist (si existe).
   */
  async getGenerosConFotosByEmail(userEmail: string): Promise<{ NombreGenero: string; FotoGenero: string; IdLista: number | null }[]> {
    const preferencias = await this.prisma.preferencia.findMany({
      where: { Email: userEmail },
      select: { NombreGenero: true },
    });

    if (!preferencias.length) {
      throw new Error(`No se encontraron géneros asociados al usuario con email ${userEmail}`);
    }

    const nombresGeneros = preferencias.map(p => p.NombreGenero);

    const generosConInfo = await Promise.all(
      nombresGeneros.map(async (nombreGenero) => {
        const genero = await this.prisma.genero.findUnique({
          where: { NombreGenero: nombreGenero },
          select: { NombreGenero: true, FotoGenero: true },
        });

        const lista = await this.prisma.listaReproduccion.findFirst({
          where: {
            Nombre: nombreGenero,
            EmailAutor: 'admin',
          },
          select: { Id: true },
        });

        return {
          NombreGenero: genero?.NombreGenero || nombreGenero,
          FotoGenero: genero?.FotoGenero || '',
          IdLista: lista?.Id ?? null,
          Descripcion: '',
        };
      })
    );

    return generosConInfo;
  }

  /**
 * Devuelve una lista con todos los géneros del sistema, marcando cuáles ha seleccionado el usuario.
 *
 * @param userEmail Correo electrónico del usuario.
 * @returns Promesa con un array de géneros y un booleano `seleccionado` por cada uno.
 */
  async getAllGenerosWithUserSelection(userEmail: string) {
    const generos = await this.prisma.genero.findMany({
      select: { NombreGenero: true },
    });

    const preferenciasUsuario = await this.prisma.preferencia.findMany({
      where: { Email: userEmail },
      select: { NombreGenero: true },
    });

    const preferenciasSet = new Set(preferenciasUsuario.map(p => p.NombreGenero));

    return generos.map(genero => ({
      NombreGenero: genero.NombreGenero,
      seleccionado: preferenciasSet.has(genero.NombreGenero),
    }));
  }

  /**
 * Actualiza las preferencias de géneros de un usuario.
 * Elimina los géneros antiguos que ya no están seleccionados y agrega los nuevos.
 *
 * @param userEmail Correo electrónico del usuario.
 * @param generos Array de nombres de géneros seleccionados.
 * @returns Mensaje de confirmación.
 */
  async updateUserPreferences(userEmail: string, generos: string[]) {
    if (!userEmail || !Array.isArray(generos) || generos.length === 0) {
      throw new BadRequestException('Email y lista de géneros son requeridos.');
    }

    const generosActuales = await this.prisma.preferencia.findMany({
      where: { Email: userEmail },
      select: { NombreGenero: true },
    });

    const generosActualesSet = new Set(generosActuales.map(g => g.NombreGenero));
    const generosEntradaSet = new Set(generos);

    const generosAEliminar = [...generosActualesSet].filter(g => !generosEntradaSet.has(g));

    if (generosAEliminar.length > 0) {
      await this.prisma.preferencia.deleteMany({
        where: {
          Email: userEmail,
          NombreGenero: { in: generosAEliminar },
        },
      });
    }

    const nuevosGeneros = generos.filter(g => !generosActualesSet.has(g)).map(genero => ({
      Email: userEmail,
      NombreGenero: genero,
    }));

    if (nuevosGeneros.length > 0) {
      await this.prisma.preferencia.createMany({
        data: nuevosGeneros,
        skipDuplicates: true,
      });
    }

    return { message: 'Preferencias actualizadas correctamente.' };
  }
}


