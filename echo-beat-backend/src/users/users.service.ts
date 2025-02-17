import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}


  async createUser(
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
  
  


async findUserByEmail(Email: string) {
    return this.prisma.usuario.findUnique({ //NO VA CON UNIQUE NO SE PORQUE COJONES NO ME LO PILLA COMO PRIMARIO EL USERNAME
      where: {
        Email,
      },
    });
  }
 
}