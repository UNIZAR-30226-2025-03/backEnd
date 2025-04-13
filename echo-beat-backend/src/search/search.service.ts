import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Servicio para realizar búsquedas en artistas, canciones, álbumes y playlists.
 */
@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) { }

  /**
 * Realiza una búsqueda general en artistas, canciones, álbumes y playlists.
 * El resultado depende del tipo especificado.
 *
 * @param query - Texto de búsqueda.
 * @param usuarioNick - Nick del usuario que realiza la búsqueda.
 * @param tipo - (Opcional) Tipo de búsqueda: 'artistas', 'canciones', 'albums', 'playlists', 'genero'.
 * @returns Resultados agrupados por tipo de entidad.
 */
  async search(query: string, usuarioNick: string, tipo?: string) {
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
        autor: album.autores.length > 0 ? album.autores[0].artista.Nombre : null,
      }))) : [],

      playlists: (tipo === 'playlists' || !tipo) ? await this.prisma.listaReproduccion.findMany({
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

      playlistsPorGenero: tipo === 'genero' ? await this.prisma.listaReproduccion.findMany({
        where: {
          Genero: {
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

      playlistsProtegidasDeAmigos: tipo === 'playlists' || !tipo ? await this.getFriendPlaylists(usuarioNick, query, tipo) : [],
    };

    return searchResults;
  }

  /**
   * Obtiene las playlists con privacidad 'protegido' creadas por amigos del usuario.
   *
   * @param usuarioNick - Nick del usuario que realiza la búsqueda.
   * @param query - Texto de búsqueda.
   * @param tipo - Tipo de búsqueda (puede ser 'genero').
   * @returns Arreglo de playlists protegidas encontradas.
   */
  private async getFriendPlaylists(usuarioNick: string, query: string, tipo?: string) {
    const amigos = await this.prisma.amistad.findMany({
      where: {
        OR: [
          { NickFriendSender: usuarioNick, EstadoSolicitud: 'aceptada' },
          { NickFriendReceiver: usuarioNick, EstadoSolicitud: 'aceptada' },
        ],
      },
      select: {
        NickFriendSender: true,
        NickFriendReceiver: true,
      },
    });

    const friendsNicknames = amigos.map(amigo =>
      amigo.NickFriendSender === usuarioNick ? amigo.NickFriendReceiver : amigo.NickFriendSender
    );

    const friendsEmails = await this.prisma.usuario.findMany({
      where: {
        Nick: {
          in: friendsNicknames,
        },
      },
      select: {
        Email: true,
      },
    });

    const friendEmailsList = friendsEmails.map(friend => friend.Email);

    const playlists = await this.prisma.listaReproduccion.findMany({
      where: {
        Nombre: {
          contains: query,
          mode: 'insensitive',
        },
        TipoPrivacidad: 'protegido',
        EmailAutor: {
          in: friendEmailsList,
        },
        Genero: tipo === 'genero' ? {
          contains: query,
          mode: 'insensitive',
        } : undefined,
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
    });

    return playlists.map(lista => ({
      id: lista.lista.Id,
      numeroLikes: lista.lista.NumLikes,
      nombre: lista.Nombre,
      portada: lista.lista.Portada,
    }));
  }
}
