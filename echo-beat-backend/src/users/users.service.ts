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
    // 🔹 Obtener el usuario y su ColaReproduccion
    const user = await this.prisma.usuario.findUnique({
      where: {
        Email,
      },
      select: {
        ColaReproduccion: true,  // Este es el campo que contiene el JSON con la cola de reproducción
      },
    });
  
    if (!user || !Array.isArray(user.ColaReproduccion) || user.ColaReproduccion.length === 0) {
      throw new Error('No se encontró la cola de reproducción del usuario o está vacía.');
    }
  
    // 🔹 Asegurarse de que cada elemento en la ColaReproduccion tiene la propiedad IdCancion
    const firstSong = user.ColaReproduccion[0];
  
    if (typeof firstSong !== 'object' || !firstSong || !('IdCancion' in firstSong)) {
      throw new Error('La cola de reproducción no tiene un formato esperado.');
    }
  
    // 🔹 Convertir `IdCancion` a número
    const firstSongId = Number(firstSong.IdCancion);  // Aseguramos que el ID sea un número
  
    // 🔹 Verificar si la canción existe
    const cancion = await this.prisma.cancion.findUnique({
      where: {
        Id: firstSongId,  // Ahora pasamos el ID correctamente como número
      },
      select: {
        Nombre: true,
        Portada: true,
      },
    });
  
    if (!cancion) {
      throw new Error('No se encontró la canción en la cola de reproducción.');
    }
  
    // 🔹 Devolver los datos de la primera canción de la cola
    return {
      PrimeraCancionId: firstSongId,
      Nombre: cancion.Nombre,
      Portada: cancion.Portada,
    };
  }
  
  

  // Nuevo método para obtener UltimaCancionEscuchada y UltimaListaEscuchada
  async getUserLastPlayedList(Email: string) {
    const user = await this.prisma.usuario.findUnique({
      where: {
        Email,
      },
      select: {
        UltimaListaEscuchada: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const registro = await this.prisma.lista.findUnique({
      where: {
        Id: user.UltimaListaEscuchada as number, // Extraído de la consulta anterior
      },
      select: {
        Nombre: true,
        Portada: true,
      },
    });


    return {
      UltimaListaEscuchada: user.UltimaListaEscuchada,
      Nombre: registro?.Nombre,
      Portada: registro?.Portada,
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
  
    if(Privacy != "privado" && Privacy != "protegido" && Privacy != "publico") {
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
}