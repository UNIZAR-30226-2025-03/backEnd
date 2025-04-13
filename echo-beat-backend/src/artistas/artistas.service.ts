import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArtistasService {
  constructor(private prisma: PrismaService) { }

  /**
 * Obtiene el perfil completo de un artista incluyendo su biografía, oyentes, foto, discografía y top 5 canciones.
 *
 * @param artistName - Nombre del artista a consultar.
 * @returns Un objeto que contiene el perfil del artista, su discografía y sus 5 canciones más populares.
 * @throws NotFoundException - Si el artista no existe en la base de datos.
 */
  async getArtistProfile(artistName: string) {
    const artista = await this.prisma.artista.findUnique({
      where: { Nombre: artistName },
      select: {
        Biografia: true,
        NumOyentesTotales: true,
        FotoPerfil: true,
      },
    });

    if (!artista) {
      throw new NotFoundException('Artista no encontrado');
    }

    const autorAlbums = await this.prisma.autorAlbum.findMany({
      where: { NombreArtista: artistName },
    });

    const albumIds = autorAlbums.map(a => a.IdAlbum);

    const albums = await this.prisma.album.findMany({
      where: { Id: { in: albumIds } },
      include: {
        lista: {
          select: {
            Nombre: true,
            Portada: true,
          },
        },
      },
    });

    const discografia = albums.map(album => ({
      Id: album.Id,
      Nombre: album.lista?.Nombre,
      Portada: album.lista?.Portada,
      NumReproducciones: album.NumReproducciones,
      FechaLanzamiento: album.FechaLanzamiento,
    }));

    const autorCanciones = await this.prisma.autorCancion.findMany({
      where: { NombreArtista: artistName },
    });

    const cancionIds = autorCanciones.map(c => c.IdCancion);

    const canciones = await this.prisma.cancion.findMany({
      where: { Id: { in: cancionIds } },
      select: {
        Id: true,
        Nombre: true,
        Portada: true,
        Duracion: true,
        NumReproducciones: true,
      },
    });

    const cancionesConAutores = await Promise.all(
      canciones.map(async cancion => {
        const autores = await this.prisma.autorCancion.findMany({
          where: { IdCancion: cancion.Id },
          select: { NombreArtista: true },
        });

        return {
          ...cancion,
          Autores: autores.map(a => a.NombreArtista),
        };
      })
    );

    const topCanciones = cancionesConAutores
      .sort((a, b) => b.NumReproducciones - a.NumReproducciones)
      .slice(0, 5);

    return {
      artista,
      discografia,
      topCanciones,
    };
  }
}