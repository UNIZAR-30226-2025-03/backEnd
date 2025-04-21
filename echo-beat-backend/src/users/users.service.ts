import { Injectable, ConflictException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlobServiceClient } from '@azure/storage-blob';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio que maneja operaciones relacionadas con usuarios.
 */
@Injectable()
export class UsersService {
  private blobServiceClient: BlobServiceClient;

  /**
 * Constructor del servicio. Inicializa el cliente de Azure Blob Storage.
 * @param prisma Servicio Prisma para acceso a la base de datos.
 */
  constructor(private readonly prisma: PrismaService) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('Azure Storage connection string is not defined');
    }
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  /**
   * Crea un nuevo usuario en la base de datos.
   * @param {string} Email - Correo electrónico del usuario.
   * @param {string} NombreCompleto - Nombre completo del usuario.
   * @param {string} Password - Contraseña del usuario.
   * @param {string} Nick - Nickname único del usuario.
   * @param {Date|null} FechaNacimiento - Fecha de nacimiento del usuario.
   * @returns {Promise<any>} Usuario creado.
   */
  async createUser(
    Email: string,
    NombreCompleto: string,
    Password: string = "",
    Nick: string,
    FechaNacimiento: Date | null
  ) {
    if (!Nick) throw new Error("Nick es obligatorio.");
    if (!NombreCompleto) throw new Error("El nombre completo es obligatorio.");

    try {
      const existingUser = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { Email },
            { Nick }
          ],
        },
      });

      if (existingUser) {
        throw new ConflictException("El correo o nickname ya están en uso.");
      }

      if (Password != null) {
        const hashedPassword = await bcrypt.hash(Password, 10);
        Password = hashedPassword;
      }

      if (FechaNacimiento == null) {
        throw new BadRequestException("La fecha de nacimiento es obligatoria.");
      }

      const newUser = await this.prisma.usuario.create({
        data: {
          Email,
          NombreCompleto,
          Password: Password,
          FechaNacimiento: FechaNacimiento,
          Nick: Nick,
          LinkFoto: process.env.URL_DEFAULT_PHOTO,
        },
      });

      console.log("Usuario creado:", newUser);
      return newUser;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException("El Nick o Email ya están en uso. Intenta con otro.");
      }
      console.error("Error al crear usuario:", error);
      throw new InternalServerErrorException("No se pudo crear el usuario.");
    }
  }

  /**
 * Busca un usuario por su correo electrónico.
 * @param {string} Email - Correo del usuario.
 * @returns {Promise<any>} Usuario encontrado.
 */
  async findUserByEmail(Email: string) {
    return this.prisma.usuario.findUnique({
      where: {
        Email,
      },
    });
  }

  /**
 * Obtiene el nickname de un usuario por su correo.
 * @param {string} Email - Correo del usuario.
 * @returns {Promise<{ Nick: string }>} Nickname del usuario.
 */
  async getUserNick(Email: string) {
    const user = await this.prisma.usuario.findUnique({
      where: {
        Email,
      },
      select: {
        Nick: true,
      },
    });

    if (!user) {
      throw new Error(`Usuario con email ${Email} no encontrado.`);
    }

    return user;
  }

  /**
   * Actualiza la contraseña de un usuario.
   * @param {string} Email - Correo del usuario.
   * @param {string} newPassword - Nueva contraseña ya encriptada.
   * @returns {Promise<any>} Contraseña actualizada.
   */
  async updatePassword(Email: string, newPassword: string) {
    return this.prisma.usuario.update({
      where: { Email },
      data: { Password: newPassword },
    });
  }

  /**
 * Obtiene la primera canción en la cola de reproducción del usuario.
 * @param {string} Email - Correo del usuario.
 * @returns {Promise<{ PrimeraCancionId: number, Nombre: string, Portada: string, MinutoEscucha: number }>} Datos de la primera canción de la cola.
 */
  async getUserFirstSongFromQueue(Email: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { Email },
      select: {
        ColaReproduccion: true,
        PosicionCola: true
      },
    });

    if (!user || !user.ColaReproduccion) {
      throw new Error('No se encontró la cola de reproducción del usuario o está vacía.');
    }

    const cola = user.ColaReproduccion as { canciones: any[] };

    if (!Array.isArray(cola.canciones) || cola.canciones.length === 0) {
      throw new Error('No hay canciones en la cola de reproducción.');
    }

    const posicion = user.PosicionCola ?? 0;

    const firstSong = cola.canciones[posicion];

    if (!firstSong || typeof firstSong !== 'object' || !('id' in firstSong)) {
      throw new Error('La primera canción no tiene el formato esperado.');
    }

    const cancionEscuchando = await this.prisma.cancionEscuchando.findUnique({
      where: {
        EmailUsuario: Email
      },
      select: {
        MinutoEscucha: true
      }
    });

    const minutoEscucha = cancionEscuchando?.MinutoEscucha ?? 0;

    return {
      PrimeraCancionId: firstSong.id,
      Nombre: firstSong.nombre,
      Portada: firstSong.portada,
      MinutoEscucha: minutoEscucha,
    };
  }

  /**
 * Devuelve la información completa del usuario.
 * @param {string} Email - Correo del usuario.
 * @returns {Promise<any>} Información del usuario.
 */
  async getUser(Email: string) {
    const user = await this.prisma.usuario.findUnique({
      where: {
        Email,
      },
    });

    if (!user) {
      throw new Error(`Usuario con email ${Email} no encontrado.`);
    }

    return user;
  }

  /**
   * Actualiza la privacidad del perfil del usuario.
   * @param {string} Email - Correo del usuario.
   * @param {string} Privacy - Nueva privacidad ('privado', 'protegido', 'publico').
   * @returns {Promise<{ message: string, newPrivacy: string }>} Mensaje de confirmación y privacidad actualizada.
   */
  async updateUserPrivacy(Email: string, Privacy: string) {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { Email: Email },
    });

    if (!existingUser) {
      throw new ConflictException('El usuario no existe.');
    }

    if (Privacy != "privado" && Privacy != "protegido" && Privacy != "publico") {
      throw new ConflictException('La privacidad utilizada como parámetro no es correcta.');
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { Email },
      data: { Privacidad: Privacy },
    });

    return {
      message: 'Tipo de privacidad actualizado correctamente.',
      newPrivacy: updatedUser.Privacidad,
    };
  }

  /**
 * Actualiza el nickname del usuario.
 * @param {string} Email - Correo del usuario.
 * @param {string} Nick - Nuevo nickname.
 * @returns {Promise<{ message: string, newNick: string }>} Mensaje de confirmación y NickName actualizado.
 */
  async updateUserNick(Email: string, Nick: string) {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { Nick: Nick },
    });

    if (existingUser) {
      throw new ConflictException('El Nick ya está en uso.');
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { Email },
      data: { Nick: Nick },
    });

    return {
      message: 'Nick actualizado correctamente.',
      newNick: updatedUser.Nick,
    };
  }

  /**
 * Actualiza la foto de perfil del usuario con una imagen personalizada.
 * @param {string} userEmail - Correo del usuario.
 * @param {Express.Multer.File} file - Archivo de imagen subido.
 * @returns {Promise<{ message: string, newPhotoUrl: string }>} Mensaje de confirmación y Foro de perfil actualizada.
 */
  async updateUserPhoto(userEmail: string, file: Express.Multer.File) {
    const user = await this.prisma.usuario.findUnique({
      where: { Email: userEmail },
      select: { LinkFoto: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const containerName = process.env.CONTAINER_USER_PHOTOS;

    if (!containerName) {
      throw new Error('La variable de entorno CONTAINER_USER_PHOTOS no está definida.');
    }

    if (user.LinkFoto) {
      const oldPhotoUrl = user.LinkFoto;
      const oldBlobName = oldPhotoUrl.split('/').pop();
      if (oldBlobName) {
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(oldBlobName);
        await blobClient.deleteIfExists();
      }
    }

    const newBlobName = `${uuidv4()}-${file.originalname}`;

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(newBlobName);
    await blobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const uploadedPhotoUrl = `${containerClient.url}/${newBlobName}`;

    await this.prisma.usuario.update({
      where: { Email: userEmail },
      data: { LinkFoto: uploadedPhotoUrl },
    });

    return { message: 'Foto actualizada correctamente', newPhotoUrl: uploadedPhotoUrl };
  }

  /**
 * Actualiza la fecha de nacimiento del usuario.
 * @param {string} userEmail - Correo del usuario.
 * @param {string} birthdate - Fecha de nacimiento (en formato ISO).
 * @returns {Promise<{ message: string, FechaNacimiento: Date }>} Mensaje de confirmación y fecha de nacimiento actualizada.
 */
  async updateUserBirthdate(userEmail: string, birthdate: string) {
    if (!userEmail || !birthdate) {
      throw new BadRequestException('Email y fecha de nacimiento son requeridos.');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { Email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const parsedDate = new Date(birthdate);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Formato de fecha inválido.');
    }

    await this.prisma.usuario.update({
      where: { Email: userEmail },
      data: { FechaNacimiento: parsedDate },
    });

    return { message: 'Fecha de nacimiento actualizada correctamente.', FechaNacimiento: parsedDate };
  }

  /**
 * Actualiza el nombre completo del usuario.
 * @param {string} userEmail - Correo del usuario.
 * @param {string} nombreReal - Nuevo nombre completo.
 * @returns {Promise<{ message: string, NombreCompleto: string }>} Mensaje de confirmación y nombre real actualizado.
 */
  async updateUserFullName(userEmail: string, nombreReal: string) {
    if (!userEmail || !nombreReal) {
      throw new BadRequestException('Email y nombre real son requeridos.');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { Email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    await this.prisma.usuario.update({
      where: { Email: userEmail },
      data: { NombreCompleto: nombreReal },
    });

    return { message: 'Nombre completo actualizado correctamente.', NombreCompleto: nombreReal };
  }

  /**
 * Devuelve las URLs de las imágenes disponibles por defecto para perfiles de usuario.
 * @returns {Promise<string[]>} Lista de URLs de imágenes predefinidas de perfil de usuario.
 */
  async getAllUserDefaultImageUrls() {

    const containerName = process.env.CONTAINER_DEFAULT_PHOTOS;

    if (!containerName) {
      throw new Error('La variable de entorno CONTAINER_DEFAULT_PHOTOS no está definida.');
    }

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const imageUrls: string[] = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      const imageUrl = `${containerClient.url}/${blob.name}`;
      imageUrls.push(imageUrl);
    }

    return imageUrls;
  }

  /**
 * Actualiza la foto de perfil del usuario usando una imagen predeterminada.
 * @param {string} userEmail - Correo del usuario.
 * @param {string} imageUrl - URL de la imagen seleccionada.
 * @returns {Promise<{ message: string }>} Mensaje de confirmación y foto de perfil actualizada.
 */
  async updateUserDefaultPhoto(userEmail: string, imageUrl: string) {
    const containerNameDefault = process.env.CONTAINER_DEFAULT_PHOTOS;
    if (!containerNameDefault) {
      throw new BadRequestException('El contenedor de imágenes predefinidas no está definido en las variables de entorno.');
    }

    const containerName = process.env.CONTAINER_USER_PHOTOS;
    if (!containerName) {
      throw new BadRequestException('El contenedor de imágenes no está definido en las variables de entorno.');
    }

    if (!imageUrl.startsWith(`${process.env.AZURE_BLOB_URL}/${containerNameDefault}`)) {
      throw new BadRequestException('El enlace proporcionado no corresponde al contenedor correcto.');
    }

    const imageName = imageUrl.split('/').pop();

    if (!imageName) {
      throw new BadRequestException('No se pudo extraer el nombre de la imagen del enlace.');
    }

    const containerClient = this.blobServiceClient.getContainerClient(containerNameDefault);
    const blobClient = containerClient.getBlobClient(imageName);

    const exists = await blobClient.exists();
    if (!exists) {
      throw new NotFoundException('La imagen no existe en el contenedor de Blob Storage.');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { Email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('No se encontró el usuario.');
    }

    if (user.LinkFoto) {
      const previousImageName = user.LinkFoto.split('/').pop();
      if (previousImageName && previousImageName !== imageName) {
        const previousContainerClient = this.blobServiceClient.getContainerClient(containerName);
        const previousBlobClient = previousContainerClient.getBlobClient(previousImageName);
        const previousExists = await previousBlobClient.exists();
        if (previousExists) {
          await previousBlobClient.deleteIfExists();
        }
      }
    }

    await this.prisma.usuario.update({
      where: { Email: userEmail },
      data: { LinkFoto: imageUrl },
    });

    return {
      message: 'Foto de perfil del usuario actualizada correctamente',
    };
  }

  /**
   * Devuelve el perfil público del usuario junto a sus playlists públicas o protegidas.
   * @param {string} userEmail - Correo del usuario.
   * @returns {Promise<{ Nick: string, LinkFoto: string, Playlists: { Id: number, Nombre: string, Portada: string }[] }>} Perfil del usuario y sus listas.
   */
  async getUserProfileWithPublicPlaylists(userEmail: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { Email: userEmail },
      select: {
        Nick: true,
        LinkFoto: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const playlists = await this.prisma.listaReproduccion.findMany({
      where: {
        EmailAutor: userEmail,
        TipoPrivacidad: { in: ['publico', 'protegido'] },
      },
      select: {
        Id: true,
        Nombre: true,
        lista: {
          select: {
            Portada: true,
          },
        },
      },
    });

    const formattedPlaylists = playlists.map(p => ({
      Id: p.Id,
      Nombre: p.Nombre,
      Portada: p.lista.Portada,
    }));

    return {
      Nick: user.Nick,
      LinkFoto: user.LinkFoto,
      Playlists: formattedPlaylists,
    };
  }

   /**
   * Obtiene el atributo de privacidad del usuario a partir de su correo electrónico.
   * @param email Correo del usuario.
   * @returns Objeto con la propiedad `Privacidad`.
   * @throws NotFoundException si el usuario no existe.
   */
   async getUserPrivacy(email: string): Promise<{ Privacidad: string }> {
    const user = await this.prisma.usuario.findUnique({
      where: { Email: email },
      select: { Privacidad: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }

    return { Privacidad: user.Privacidad };
  }
}