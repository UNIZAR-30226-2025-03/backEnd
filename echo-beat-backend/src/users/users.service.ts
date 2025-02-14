import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}


async createUser(username: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10); // Cifra la contraseña
  return this.prisma.user.create({
    data: {
      username,
      password: hashedPassword, // Guarda la contraseña cifrada
    },
  });
}


async findUserByUsername(username: string) {
    return this.prisma.user.findFirst({ //NO VA CON UNIQUE NO SE PORQUE COJONES NO ME LO PILLA COMO PRIMARIO EL USERNAME
      where: {
        username,
      },
    });
  }
 
}