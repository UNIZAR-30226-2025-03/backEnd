import { Injectable,ConflictException,InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}


  async createUser(
    Email: string,
    Password: string,
    Nick: string,
    FechaNacimiento: Date,  // ✅ Asegurar que recibe Date
  ) {
    if (!Nick) throw new Error("Nick es obligatorio.");

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
 
    // Nuevo método para obtener UltimaCancionEscuchada y UltimaListaEscuchada
    async getUserLastPlayedData(Email: string) {
      const user = await this.prisma.usuario.findUnique({
        where: {
          Email,
        },
        select: {
          UltimaCancionEscuchada: true,
          UltimaListaEscuchada: true,
        },
      });
  
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
  
      return {
        UltimaCancionEscuchada: user.UltimaCancionEscuchada,
        UltimaListaEscuchada: user.UltimaListaEscuchada,
      };
    }

    /**
   * Obtiene el minuto de escucha de una canción para un usuario específico.
   *
   * @param EmailUsuario - El correo electrónico del usuario.
   * @param IdCancion - El ID de la canción.
   * @returns El minuto en el que el usuario dejó la canción.
   */
  async getMinutoEscucha(EmailUsuario: string, IdCancion: number): Promise<number> {
    const registro = await this.prisma.cancionEscuchando.findUnique({
      where: {
        EmailUsuario_IdCancion: {
          EmailUsuario,
          IdCancion,
        },
      },
      select: {
        MinutoEscucha: true,
      },
    });

    if (!registro) {
      throw new NotFoundException('No se encontró un registro de escucha para esta canción y usuario.');
    }
    return registro.MinutoEscucha;
  }
}