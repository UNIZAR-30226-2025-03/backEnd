import { Injectable, ConflictException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlobServiceClient } from '@azure/storage-blob';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class UsersService {
  private blobServiceClient: BlobServiceClient;
  constructor(private readonly prisma: PrismaService) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('Azure Storage connection string is not defined');
    }
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }


  async createUser(
    Email: string,
    NombreCompleto: string, // 🔹 Nuevo campo obligatorio
    Password: string = "", // 🔹 Si no se pasa, será un string vacío
    Nick: string,
    FechaNacimiento: Date | null
  ) {
    if (!Nick) throw new Error("Nick es obligatorio.");
    if (!NombreCompleto) throw new Error("El nombre completo es obligatorio.");


    try {
      // 🔹 Verificar si el usuario ya existe (Email o Nick repetido)
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

      // 🔹 Cifrar la contraseña si no ha usado google
      if (Password != null) {
        const hashedPassword = await bcrypt.hash(Password, 10);
        Password = hashedPassword;
      }

      if (FechaNacimiento == null) {
        throw new BadRequestException("La fecha de nacimiento es obligatoria.");
      }
      // 🔹 Crear el usuario
      const newUser = await this.prisma.usuario.create({
        data: {
          Email,
          NombreCompleto, // 🔹 Guardar el nombre completo
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

  async findUserByEmail(Email: string) {
    return this.prisma.usuario.findUnique({
      where: {
        Email,
      },
    });
  }

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

  async updatePassword(Email: string, newPassword: string) {
    return this.prisma.usuario.update({
      where: { Email },
      data: { Password: newPassword },
    });
  }

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

    // Forzamos el tipo de ColaReproduccion para acceder a canciones
    const cola = user.ColaReproduccion as { canciones: any[] };

    if (!Array.isArray(cola.canciones) || cola.canciones.length === 0) {
      throw new Error('No hay canciones en la cola de reproducción.');
    }

    const posicion = user.PosicionCola ?? 0; // Si es null, lo ponemos en 0 por defecto

    const firstSong = cola.canciones[posicion];

    if (!firstSong || typeof firstSong !== 'object' || !('id' in firstSong)) {
      throw new Error('La primera canción no tiene el formato esperado.');
    }

    // Buscar el minuto en que el usuario está escuchando esta canción
    const cancionEscuchando = await this.prisma.cancionEscuchando.findUnique({
      where: {
        EmailUsuario: Email  // Usamos solo EmailUsuario como clave primaria
      },
      select: {
        MinutoEscucha: true
      }
    });

    // Si no se encuentra el minuto de escucha, asignar 0
    const minutoEscucha = cancionEscuchando?.MinutoEscucha ?? 0;

    return {
      PrimeraCancionId: firstSong.id,
      Nombre: firstSong.nombre,
      Portada: firstSong.portada,
      MinutoEscucha: minutoEscucha,  // Incluimos el minuto de la canción que está escuchando el usuario
    };
  }

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

  async updateUserPrivacy(Email: string, Privacy: string) {
    // Verificar si el nuevo Nick ya está en uso
    const existingUser = await this.prisma.usuario.findUnique({
      where: { Email: Email },
    });

    if (!existingUser) {
      throw new ConflictException('El usuario no existe.');
    }

    if (Privacy != "privado" && Privacy != "protegido" && Privacy != "publico") {
      throw new ConflictException('La privacidad utilizada como parámetro no es correcta.');
    }

    // Actualizar el Nick del usuario
    const updatedUser = await this.prisma.usuario.update({
      where: { Email },
      data: { Privacidad: Privacy },
    });

    return {
      message: 'Tipo de privacidad actualizado correctamente.',
      newPrivacy: updatedUser.Privacidad,
    };
  }

  async updateUserNick(Email: string, Nick: string) {
    // Verificar si el nuevo Nick ya está en uso
    const existingUser = await this.prisma.usuario.findUnique({
      where: { Nick: Nick },
    });

    if (existingUser) {
      throw new ConflictException('El Nick ya está en uso.');
    }

    // Actualizar el Nick del usuario
    const updatedUser = await this.prisma.usuario.update({
      where: { Email },
      data: { Nick: Nick },
    });

    return {
      message: 'Nick actualizado correctamente.',
      newNick: updatedUser.Nick,
    };
  }

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

    // Eliminar la foto anterior si existe
    if (user.LinkFoto) {
      const oldPhotoUrl = user.LinkFoto;
      const oldBlobName = oldPhotoUrl.split('/').pop();
      if (oldBlobName) {
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(oldBlobName);
        await blobClient.deleteIfExists();
      }
    }

    // Generar un nuevo nombre de archivo único
    const newBlobName = `${uuidv4()}-${file.originalname}`;

    // Subir el archivo a Azure Blob Storage
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(newBlobName);
    await blobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    // Construir la nueva URL de la foto en Azure Blob Storage
    const uploadedPhotoUrl = `${containerClient.url}/${newBlobName}`;

    // Actualizar la base de datos con la nueva URL
    await this.prisma.usuario.update({
      where: { Email: userEmail },
      data: { LinkFoto: uploadedPhotoUrl },
    });

    return { message: 'Foto actualizada correctamente', newPhotoUrl: uploadedPhotoUrl };
  }

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

  async getAllUserDefaultImageUrls() {
    // 🔹 Verificar que el contenedor está configurado

    const containerName = process.env.CONTAINER_DEFAULT_PHOTOS;

    if (!containerName) {
      throw new Error('La variable de entorno CONTAINER_DEFAULT_PHOTOS no está definida.');
    }

    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const imageUrls: string[] = [];

    // 🔹 Acceder a todos los blobs en el contenedor
    for await (const blob of containerClient.listBlobsFlat()) {
      // Construir la URL de cada imagen
      const imageUrl = `${containerClient.url}/${blob.name}`;
      imageUrls.push(imageUrl);
    }

    return imageUrls;
  }

  async updateUserDefaultPhoto(userEmail: string, imageUrl: string) {
    const containerNameDefault = process.env.CONTAINER_DEFAULT_PHOTOS;
    if (!containerNameDefault) {
      throw new BadRequestException('El contenedor de imágenes predefinidas no está definido en las variables de entorno.');
    }

    const containerName = process.env.CONTAINER_USER_PHOTOS;
    if (!containerName) {
      throw new BadRequestException('El contenedor de imágenes no está definido en las variables de entorno.');
    }

    // Comprobar si la URL de la imagen corresponde al contenedor correcto
    if (!imageUrl.startsWith(`${process.env.AZURE_BLOB_URL}/${containerNameDefault}`)) {
      throw new BadRequestException('El enlace proporcionado no corresponde al contenedor correcto.');
    }

    // Obtener el nombre de la imagen del enlace
    const imageName = imageUrl.split('/').pop();

    if (!imageName) {
      throw new BadRequestException('No se pudo extraer el nombre de la imagen del enlace.');
    }

    // Verificar si la imagen existe en Blob Storage
    const containerClient = this.blobServiceClient.getContainerClient(containerNameDefault);
    const blobClient = containerClient.getBlobClient(imageName);

    const exists = await blobClient.exists();
    if (!exists) {
      throw new NotFoundException('La imagen no existe en el contenedor de Blob Storage.');
    }

    // Obtener la playlist del usuario
    const user = await this.prisma.usuario.findUnique({
      where: { Email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('No se encontró el usuario.');
    }

    // Si ya existe una portada anterior, comprobar si es del mismo contenedor y borrarla
    if (user.LinkFoto) {
      const previousImageName = user.LinkFoto.split('/').pop();
      if (previousImageName && previousImageName !== imageName) {
        const previousContainerClient = this.blobServiceClient.getContainerClient(containerName);
        const previousBlobClient = previousContainerClient.getBlobClient(previousImageName);
        const previousExists = await previousBlobClient.exists();
        if (previousExists) {
          // Eliminar la imagen anterior
          await previousBlobClient.deleteIfExists();
        }
      }
    }

    // Actualizar la portada de la playlist en la tabla Lista
    await this.prisma.usuario.update({
      where: { Email: userEmail },
      data: { LinkFoto: imageUrl },
    });

    return {
      message: 'Foto de perfil del usuario actualizada correctamente',
    };
  }

  async getUserProfileWithPublicPlaylists(userEmail: string) {
    // 🔹 1️⃣ Obtener Nick y LinkFoto del usuario
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

    // 🔹 2️⃣ Obtener las listas de reproducción públicas o protegidas del usuario
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

    // 🔹 3️⃣ Formatear el resultado para que Portada esté al mismo nivel
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
}