import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  // Método de búsqueda con el filtro 'tipo'
  async search(query: string, tipo?: string) {
    const searchResults = {
      artistas: tipo === 'artistas' || !tipo ? await this.prisma.artista.findMany({
        where: {
          Nombre: {
            contains: query,
            mode: 'insensitive',
          },
        },
      }) : [],
      
      canciones: tipo === 'canciones' || !tipo ? await this.prisma.cancion.findMany({
        where: {
          Nombre: {
            contains: query,
            mode: 'insensitive',
          },
        },
      }) : [],

      albums: tipo === 'albums' || !tipo ? await this.prisma.album.findMany({
        where: {
          lista: {
            Nombre: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
      }) : [],

      listas: tipo === 'playlists' || !tipo ? await this.prisma.listaReproduccion.findMany({
        where: {
          Nombre: {
            contains: query,
            mode: 'insensitive',
          },
          TipoPrivacidad : 'publico'
        },
      }) : [],
    };

    return searchResults;
  }
}
