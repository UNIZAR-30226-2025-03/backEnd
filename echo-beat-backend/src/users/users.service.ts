import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

/*
  async createUser(NotFoundException
    Email: string,
    Password: string,
    Nick: string,
    Edad?: number,
    LinkFoto?: string,
    BooleanPrivacidad?: string,
    UltimaListaEscuchada?: number,
    UltimaCancionEscuchada?: number
  ) {
    if (!Nick) throw new Error("Nick es obligatorio.");

    try {
      const hashedPassword = await bcrypt.hash(Password, 10); // Cifra la contraseña
  
      const newUser = await this.prisma.usuario.create({
        data: {
          Email,
          Password: hashedPassword,
          Edad: Edad ?? null, 
          Nick: Nick ?? null, // Nick es único, Prisma dará error si ya existe
          LinkFoto: LinkFoto ?? null, 
          BooleanPrivacidad: BooleanPrivacidad ?? "false", 
          UltimaListaEscuchada: UltimaListaEscuchada ?? null,
          UltimaCancionEscuchada: UltimaCancionEscuchada ?? null
        },
      });
  
      console.log("Usuario creado:", newUser);
      return newUser;
    } catch (error) {
      // Si es un error de Prisma y es por clave única duplicada
      if (error.code === 'P2002') {
        throw new Error("El Nick o Email ya están en uso. Intenta con otro.");
      }
  
      console.error("Error al crear usuario:", error);
      throw new Error("No se pudo crear el usuario.");
    }
  }
*/
  


async findUserByEmail(Email: string) {
    return this.prisma.usuario.findUnique({ //NO VA CON UNIQUE NO SE PORQUE COJONES NO ME LO PILLA COMO PRIMARIO EL USERNAME
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