import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

class CreatePlaylistDto {
  name: string;
  description: string;
  isPublic: boolean;
}

class UpdatePlaylistDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

const ADMIN_EMAIL = "admin";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }
  /**
   * Obtiene todas las playlists predefinidas creadas por el administrador.
   * 
   * @returns Lista de playlists predefinidas con sus canciones ordenadas.
   */
  async findAllPredefinedPlaylists() {
    const predefinedPlaylists = await this.prisma.listaReproduccion.findMany({
      where: { EmailAutor: ADMIN_EMAIL },
      include: {
        lista: {
          include: {
            posiciones: {
              include: {
                cancion: true,
              },
              orderBy: {
                Posicion: 'asc',
              },
            },
          },
        },
      },
    });

    return predefinedPlaylists.map(playlist => ({
      id: playlist.Id,
      name: playlist.Nombre,
      description: playlist.lista.Descripcion,
      privacy: playlist.TipoPrivacidad,
      genre: playlist.Genero,
      coverImage: playlist.lista.Portada,
      totalSongs: playlist.lista.NumCanciones,
      duration: playlist.lista.Duracion,
      likes: playlist.lista.NumLikes,
      songs: playlist.lista.posiciones.map(pos => ({
        id: pos.cancion.Id,
        name: pos.cancion.Nombre,
        duration: pos.cancion.Duracion,
        position: pos.Posicion,
        coverImage: pos.cancion.Portada
      }))
    }));
  }

  async deleteUser(email: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { Email: email },
    });
    if (!user) {
      throw new NotFoundException(`El usuario con correo ${email} no existe`);
    }

    await this.prisma.usuario.delete({
      where: { Email: email },
    });

    return { message: `Usuario con correo ${email} eliminado correctamente.` };
  }

  async getAllUsers() {
    const users = await this.prisma.usuario.findMany({
      where: { Email: { not: ADMIN_EMAIL } },
    });

    if (users.length === 0) {
      throw new NotFoundException('No se encontraron usuarios.');
    }

    return users.map(user => ({
      id: user.Email,
      email: user.Email,
      name: user.NombreCompleto,
      birthDate: user.FechaNacimiento,
    }));
  }

  /**
   * Exporta datos relevantes de la aplicación de forma estructurada.
   * Se incluyen usuarios, artistas, canciones, listas, albums, mensajes, amistades y otras entidades relevantes.
   */
  async exportAllData() {
    // Usuarios con relaciones importantes
    const usuarios = await this.prisma.usuario.findMany({
      include: {
        listas: true,
        cancionesGuardadas: true,
        cancionesEscuchadas: true,
        cancionesEscuchando: true,
        mensajesEnviados: true,
        mensajesRecibidos: true,
        preferencias: true,
        amistadesEnviadas: true,
        amistadesRecibidas: true,
        likes: true,
      },
    });

    // Likes (relación entre usuarios y listas)
    const likes = await this.prisma.like.findMany();

    // Artistas, incluyendo sus álbumes y canciones
    const artistas = await this.prisma.artista.findMany({
      include: {
        albums: true, // relaciones definidas en AutorAlbum más adelante
        canciones: true, // relaciones definidas en AutorCancion
      },
    });

    // Canciones con relaciones (autores, en listas y estadísticas)
    const canciones = await this.prisma.cancion.findMany({
      include: {
        autores: true,
        listas: true,
        cancionesGuardadas: true,
        cancionesEscuchadas: true,
        cancionEscuchando: true,
      },
    });

    // Géneros y las preferencias asociadas
    const generos = await this.prisma.genero.findMany({
      include: {
        preferencias: true,
      },
    });

    // Listas (información de listas generales)
    const listas = await this.prisma.lista.findMany({
      include: {
        posiciones: true,
        likes: true,
        album: true,
        listaReproduccion: true,
      },
    });

    // Albums con su lista y autores
    const albums = await this.prisma.album.findMany({
      include: {
        lista: true,
        autores: true,
      },
    });

    // Listas de reproducción (con información del autor)
    const listaReproduccion = await this.prisma.listaReproduccion.findMany({
      include: {
        autor: true,
        lista: true,
      },
    });

    // Otras entidades simples
    const cancionGuardada = await this.prisma.cancionGuardada.findMany();
    const cancionEscuchada = await this.prisma.cancionEscuchada.findMany();
    const cancionEscuchando = await this.prisma.cancionEscuchando.findMany();
    const autorAlbum = await this.prisma.autorAlbum.findMany();
    const autorCancion = await this.prisma.autorCancion.findMany();
    const mensajes = await this.prisma.mensaje.findMany();
    const amistades = await this.prisma.amistad.findMany();
    const preferencias = await this.prisma.preferencia.findMany();
    const posicionCancion = await this.prisma.posicionCancion.findMany();

    // Retornar la información de forma estructurada
    return {
      usuarios,
      likes,
      artistas,
      canciones,
      generos,
      listas,
      albums,
      listaReproduccion,
      cancionGuardada,
      cancionEscuchada,
      cancionEscuchando,
      autorAlbum,
      autorCancion,
      mensajes,
      amistades,
      preferencias,
      posicionCancion,
    };
  }


  
}