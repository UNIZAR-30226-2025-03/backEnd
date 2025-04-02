import { Injectable, BadRequestException } from '@nestjs/common';
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
  async getGenerosConFotosByEmail(userEmail: string): Promise<{ NombreGenero: string; FotoGenero: string; IdLista: number | null }[]> {
    // Obtener los géneros asociados al usuario
    const preferencias = await this.prisma.preferencia.findMany({
      where: { Email: userEmail },
      select: { NombreGenero: true },
    });
  
    if (!preferencias.length) {
      throw new Error(`No se encontraron géneros asociados al usuario con email ${userEmail}`);
    }
  
    const nombresGeneros = preferencias.map(p => p.NombreGenero);
  
    // Obtener la información del género junto con la lista de reproducción
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
          Descripcion: '', // Asegúrate de que la propiedad exista en tu modelo
        };
      })
    );
  
    return generosConInfo;
  }

  async getAllGenerosWithUserSelection(userEmail: string) {
    // 🔹 Obtener todos los géneros de la aplicación
    const generos = await this.prisma.genero.findMany({
      select: { NombreGenero: true },
    });

    // 🔹 Obtener los géneros seleccionados por el usuario en la tabla Preferencia
    const preferenciasUsuario = await this.prisma.preferencia.findMany({
      where: { Email: userEmail },
      select: { NombreGenero: true },
    });

    // 🔹 Convertir las preferencias del usuario en un Set para fácil acceso
    const preferenciasSet = new Set(preferenciasUsuario.map(p => p.NombreGenero));

    // 🔹 Mapear los géneros con el booleano `seleccionado`
    return generos.map(genero => ({
      NombreGenero: genero.NombreGenero,
      seleccionado: preferenciasSet.has(genero.NombreGenero), // ✅ true si está en Preferencia, false si no
    }));
  }
  
  async updateUserPreferences(userEmail: string, generos: string[]) {
    if (!userEmail || !Array.isArray(generos) || generos.length === 0) {
      throw new BadRequestException('Email y lista de géneros son requeridos.');
    }

    // 🔹 Obtener los géneros actuales en la base de datos para ese usuario
    const generosActuales = await this.prisma.preferencia.findMany({
      where: { Email: userEmail },
      select: { NombreGenero: true },
    });

    const generosActualesSet = new Set(generosActuales.map(g => g.NombreGenero));
    const generosEntradaSet = new Set(generos);

    // 🔥 1️⃣ Eliminar géneros que están en la BD pero no en la entrada
    const generosAEliminar = [...generosActualesSet].filter(g => !generosEntradaSet.has(g));

    if (generosAEliminar.length > 0) {
      await this.prisma.preferencia.deleteMany({
        where: {
          Email: userEmail,
          NombreGenero: { in: generosAEliminar },
        },
      });
    }

    // 🔥 2️⃣ Agregar los nuevos géneros (evitando duplicados)
    const nuevosGeneros = generos.filter(g => !generosActualesSet.has(g)).map(genero => ({
      Email: userEmail,
      NombreGenero: genero,
    }));

    if (nuevosGeneros.length > 0) {
      await this.prisma.preferencia.createMany({
        data: nuevosGeneros,
        skipDuplicates: true, // 🔹 Evita insertar si ya existe
      });
    }

    return { message: 'Preferencias actualizadas correctamente.' };
  }
}


