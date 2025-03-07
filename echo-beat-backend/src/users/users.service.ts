import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlobServiceClient } from '@azure/storage-blob';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class UsersService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;
  constructor(private readonly prisma: PrismaService) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = 'user-photos';
    
    if (!connectionString) {
      throw new Error('Azure Storage connection string is not defined');
    }
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }


  async createUser(
    Email: string,
    NombreCompleto: string, // 🔹 Nuevo campo obligatorio
    Password: string,
    Nick: string,
    FechaNacimiento: Date  // ✅ Asegurar que recibe Date
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

      // 🔹 Cifrar la contraseña
      const hashedPassword = await bcrypt.hash(Password, 10);

      // 🔹 Crear el usuario
      const newUser = await this.prisma.usuario.create({
        data: {
          Email,
          NombreCompleto, // 🔹 Guardar el nombre completo
          Password: hashedPassword,
          FechaNacimiento: new Date(),
          Nick: Nick,
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

  // Nuevo método para obtener UltimaCancionEscuchada y UltimaListaEscuchada
  async getUserLastPlayedSong(Email: string) {
    const user = await this.prisma.usuario.findUnique({
      where: {
        Email,
      },
      select: {
        UltimaCancionEscuchada: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const registro = await this.prisma.cancionEscuchando.findUnique({
      where: {
        EmailUsuario_IdCancion: {
          EmailUsuario: Email, // Parámetro de entrada
          IdCancion: user.UltimaCancionEscuchada as number, // Extraído de la consulta anterior
        },
      },
      select: {
        MinutoEscucha: true,
      },
    });

    const cancion = await this.prisma.cancion.findUnique({
      where: {
        Id: user.UltimaCancionEscuchada as number, // Buscar por el IdCancion obtenido de usuario
      },
      select: {
        Nombre: true,
        Portada: true,
      },
    });

    return {
      UltimaCancionEscuchada: user.UltimaCancionEscuchada,
      MinutoEscucha: registro ? registro.MinutoEscucha : null,
      Nombre: cancion?.Nombre,
      Portada: cancion?.Portada,
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

    // Eliminar la foto anterior si existe
    if (user.LinkFoto) {
      const oldPhotoUrl = user.LinkFoto;
      const oldBlobName = oldPhotoUrl.split('/').pop();
      if (oldBlobName) {
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blobClient = containerClient.getBlobClient(oldBlobName);
        await blobClient.deleteIfExists();
      }
    }

    // Generar un nuevo nombre de archivo único
    const newBlobName = `${uuidv4()}-${file.originalname}`;

    // 3️⃣ Subir el archivo a Azure Blob Storage
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
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
  
}