import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArtistasService {
  constructor(private prisma: PrismaService) { }

  async getArtistProfile(artistName: string) {
    // 1️⃣ Buscar datos básicos del artista
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

    // 2️⃣ Obtener los álbumes del artista desde AutorAlbum
    const autorAlbums = await this.prisma.autorAlbum.findMany({
      where: { NombreArtista: artistName },
    });

    const albumIds = autorAlbums.map(a => a.IdAlbum);

    // 3️⃣ Obtener datos de álbumes
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

    // 4️⃣ Obtener canciones del artista desde AutorCancion
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

  // 5️⃣ Para cada canción, obtener los autores
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



    // 6️⃣ Ordenar y seleccionar el top 5
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
