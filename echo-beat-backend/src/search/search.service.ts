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
        include: {
          lista: {
            select: {
              Nombre: true,
              Portada: true,
              NumCanciones: true,
            },
          },
          autores: {
            include: {
              artista: {
                select: {
                  Nombre: true,
                },
              },
            },
          },
        },
      }).then(albums => albums.map(album => ({
        id: album.Id,
        nombre: album.lista.Nombre,
        portada: album.lista.Portada,
        numCanciones: album.lista.NumCanciones,
        autor: album.autores.length > 0 ? album.autores[0].artista.Nombre : null, // corregido aquí
      }))) : [],
      
  
      playlists: tipo === 'playlists' || !tipo ? await this.prisma.listaReproduccion.findMany({
        where: {
          Nombre: {
            contains: query,
            mode: 'insensitive',
          },
          TipoPrivacidad: 'publico',
        },
        include: {
          lista: {
            select: {
              Id: true,
              Portada: true,
              NumLikes: true,
            },
          },
        },
      }).then(listas => listas.map(lista => ({
        id: lista.lista.Id,
        numeroLikes: lista.lista.NumLikes,
        nombre: lista.Nombre,
        portada: lista.lista.Portada,
      }))) : [],
      
    };
  
    return searchResults;
  }
  
}
