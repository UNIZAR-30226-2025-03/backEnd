import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Asegúrate de tener PrismaService

@Injectable()
export class GeneroService {
  constructor(private readonly prisma: PrismaService) {}

/**
 * Obtiene todos los géneros asociados a un usuario y sus respectivas fotos.
 *
 * A partir del correo electrónico del usuario, consulta la tabla `preferencia` para obtener los nombres de los géneros
 * y luego consulta la tabla `genero` para obtener la foto correspondiente a cada género.
 *
 * @param userEmail - Correo electrónico del usuario.
 * @returns Una promesa que resuelve un arreglo de objetos con `NombreGenero` y `FotoGenero`.
 */
async getGenerosConFotosByEmail(userEmail: string): Promise<{ NombreGenero: string; FotoGenero: string }[]> {
  // Obtener los géneros asociados al usuario
  const preferencias = await this.prisma.preferencia.findMany({
    where: { Email: userEmail },
    select: { NombreGenero: true },
  });

  // Si el usuario no tiene géneros asociados, devolver un array vacío
  if (!preferencias.length) {
    throw new Error(`No se encontraron géneros asociados al usuario con email ${userEmail}`);
  }

  // Obtener las fotos de los géneros consultando la tabla `genero`
  const nombresGeneros = preferencias.map(p => p.NombreGenero);
  const generosConFotos = await this.prisma.genero.findMany({
    where: { NombreGenero: { in: nombresGeneros } },
    select: { NombreGenero: true, FotoGenero: true },
  });

  return generosConFotos; // Devuelve un array de objetos { NombreGenero, FotoGenero }
}

      
}


