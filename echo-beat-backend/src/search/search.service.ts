import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  // Método de búsqueda con el filtro 'tipo'
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
  
      playlists: tipo === 'playlists' || !tipo ? await this.prisma.listaReproduccion.findMany({
        where: {
          Nombre: {
            contains: query,
            mode: 'insensitive',
          },
          // Incluye las listas públicas
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

      // Ahora incluimos las playlists protegidas de los amigos
      playlistsProtegidasDeAmigos: tipo === 'playlists' || !tipo ? await this.getFriendPlaylists(usuarioNick, query) : [],
    };

    return searchResults;
  }

  // Método para obtener playlists de amigos del usuario
private async getFriendPlaylists(usuarioNick: string, query: string) {
  // Obtener los amigos del usuario actual
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

  // Crear una lista de amigos con las cuales el usuario tiene una amistad aceptada
  const friendsNicknames = amigos.map(amigo =>
    amigo.NickFriendSender === usuarioNick ? amigo.NickFriendReceiver : amigo.NickFriendSender
  );

  // Obtener los correos electrónicos de los amigos a partir de los nicks
  const friendsEmails = await this.prisma.usuario.findMany({
    where: {
      Nick: {
        in: friendsNicknames, // Buscar los amigos por su nick
      },
    },
    select: {
      Email: true, // Obtener el email de los amigos
    },
  });

  // Extraer los emails de los amigos
  const friendEmailsList = friendsEmails.map(friend => friend.Email);

  // Buscar las playlists protegidas de esos amigos usando los emails
  const playlists = await this.prisma.listaReproduccion.findMany({
    where: {
      Nombre: {
        contains: query,
        mode: 'insensitive',
      },
      TipoPrivacidad: 'protegido', // Solo las playlists protegidas
      EmailAutor: {
        in: friendEmailsList, // Buscar las listas de los amigos por su EmailAutor
      },
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
