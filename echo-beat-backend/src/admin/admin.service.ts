import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { parseBuffer } from 'music-metadata';

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
  private blobServiceClient: BlobServiceClient;
  constructor(private readonly prisma: PrismaService) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('Azure Storage connection string is not defined');
    }
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }
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

  /**
 * Crea un nuevo artista en la base de datos.
 * @param nombre Nombre del artista (debe ser único)
 * @param biografia Breve biografía del artista
 * @param foto Archivo de foto de perfil
 * @returns Objeto con los datos del nuevo artista
 */
  async createArtista(nombre: string, biografia: string, foto: Express.Multer.File) {
    if (!nombre || !biografia || !foto) {
      throw new BadRequestException('Todos los campos son obligatorios.');
    }

    const exists = await this.prisma.artista.findUnique({
      where: { Nombre: nombre },
    });

    if (exists) {
      throw new ConflictException('Ya existe un artista con ese nombre.');
    }

    const containerName = process.env.CONTAINER_ARTIST_PHOTOS;
    if (!containerName) {
      throw new Error('La variable de entorno CONTAINER_ARTIST_PHOTOS no está definida.');
    }

    const newBlobName = `${uuidv4()}-${foto.originalname.replace(/\s+/g, '-')}`;
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(newBlobName);

    await blobClient.uploadData(foto.buffer, {
      blobHTTPHeaders: { blobContentType: foto.mimetype },
    });

    const urlFoto = `${containerClient.url}/${newBlobName}`;

    const nuevoArtista = await this.prisma.artista.create({
      data: {
        Nombre: nombre,
        Biografia: biografia,
        NumOyentesTotales: 0,
        FotoPerfil: urlFoto,
      },
    });

    return nuevoArtista;
  }

  /**
   * Crea una nueva canción en la base de datos y la relaciona con su autor y un álbum asociado.
   * @param nombre Nombre de la canción
   * @param genero Género de la canción
   * @param portada Archivo de imagen
   * @param mp3 Archivo de audio en formato .mp3
   * @param nombreArtista Nombre del artista (debe existir)
   * @returns Objeto con los datos de la nueva canción
   */
  async crearCancionCompleta(
    nombre: string,
    genero: string,
    portada: Express.Multer.File,
    mp3: Express.Multer.File,
    nombreArtista: string
  ) {
    if (!nombre || !genero || !portada || !mp3 || !nombreArtista) {
      throw new BadRequestException('Todos los campos y archivos son obligatorios.');
    }

    const containerFotos = process.env.CONTAINER_SONG_PHOTOS;
    const containerCanciones = process.env.CONTAINER_SONGS;

    if (!containerFotos || !containerCanciones) {
      throw new Error('Faltan contenedores en variables de entorno.');
    }

    const nombreImg = `${uuidv4()}-${portada.originalname.replace(/\s+/g, '-')}`;
    const clientFoto = this.blobServiceClient.getContainerClient(containerFotos);
    const blobFoto = clientFoto.getBlockBlobClient(nombreImg);
    await blobFoto.uploadData(portada.buffer, {
      blobHTTPHeaders: { blobContentType: portada.mimetype },
    });
    const urlFoto = `${clientFoto.url}/${nombreImg}`;

    const nombreMp3 = `${nombre.trim().replace(/\s+/g, '_')}.mp3`;
    const clientMp3 = this.blobServiceClient.getContainerClient(containerCanciones);
    const blobMp3 = clientMp3.getBlockBlobClient(nombreMp3);
    await blobMp3.uploadData(mp3.buffer, {
      blobHTTPHeaders: { blobContentType: 'application/octet-stream' },
    });

    const metadata = await parseBuffer(mp3.buffer, mp3.mimetype);
    const duracionEnSegundos = Math.round(metadata.format.duration || 0);

    const artista = await this.prisma.artista.findUnique({
      where: { Nombre: nombreArtista },
    });

    if (!artista) {
      throw new NotFoundException('El artista no existe');
    }

    const cancion = await this.prisma.cancion.create({
      data: {
        Nombre: nombre,
        Genero: genero,
        Portada: urlFoto,
        Duracion: duracionEnSegundos,
        NumFavoritos: 0,
        NumReproducciones: 0,
      },
    });

    await this.prisma.autorCancion.create({
      data: {
        IdCancion: cancion.Id,
        NombreArtista: nombreArtista,
      },
    });

    const album = await this.prisma.album.create({
      data: {
        FechaLanzamiento: new Date(),
        NumReproducciones: 0,
        lista: {
          create: {
            Nombre: `Álbum de ${nombre}`,
            NumCanciones: 1,
            Duracion: duracionEnSegundos,
            NumLikes: 0,
            Descripcion: `Álbum que contiene la canción ${nombre}`,
            Portada: urlFoto,
            TipoLista: 'Album',
          },
        },
      },
      include: {
        lista: true,
      },
    });

    await this.prisma.autorAlbum.create({
      data: {
        IdAlbum: album.Id,
        NombreArtista: nombreArtista,
      },
    });

    await this.prisma.posicionCancion.create({
      data: {
        IdLista: album.Id,
        IdCancion: cancion.Id,
        Posicion: 0
      },
    });

    return {
      cancion,
      mensaje: 'Canción, autor y álbum creados correctamente',
    };
  }
}