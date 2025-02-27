import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Asegúrate de tener PrismaService

@Injectable()
export class GeneroService {
  constructor(private readonly prisma: PrismaService) {}

    /**
   * Busca todos los géneros asociados a un usuario por su correo electrónico.
   * 
   * Esta función realiza una consulta en la base de datos para obtener todas las preferencias
   * de un usuario identificado por su `userEmail`, y devuelve una lista con los nombres de los géneros
   * asociados a ese correo. La consulta solo obtiene el campo `NombreGenero` de la tabla `Preferencias`.
   * 
   * @param userEmail - Correo electrónico del usuario cuya información de preferencias se quiere obtener.
   * @returns Una promesa que resuelve un arreglo de cadenas (nombres de géneros) asociados al `userEmail`.
   */
  async getGenerosByEmail(userEmail: string): Promise<string[]> {
    const preferencias = await this.prisma.preferencia.findMany({
      where: {
        Email: userEmail,
      },
      select: {
        NombreGenero: true, // Selecciona solo el campo NombreGenero
      },
    });

    return preferencias.map(preferencia => preferencia.NombreGenero); // Devuelve los nombres de géneros
  }

    /**
   * Obtiene la foto asociada a un género basado en el nombre del género.
   * 
   * @param nombreGenero Nombre del género a buscar.
   * @returns La URL o ruta de la foto asociada al género.
   */
  
    async getFotoGeneroByNombre(nombreGenero: string): Promise<string> {
        const genero = await this.prisma.genero.findUnique({
          where: { NombreGenero: nombreGenero },
          select: { FotoGenero: true }, // Solo selecciona el campo FotoGenero
        });
    
        if (!genero) {
          throw new Error('Género no encontrado');
        }
    
        return genero.FotoGenero; // Retorna la foto del género
      }
      
}


