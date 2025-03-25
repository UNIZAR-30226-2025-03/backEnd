import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EstadoUsuarioService {
  constructor(private readonly prisma: PrismaService) {}

    async storeLastSong(Email: string, songId: number) {
        const user = await this.prisma.cancionEscuchando.upsert({
          where: {
            EmailUsuario: Email
          },
          update: { 
            IdCancion: songId, MinutoEscucha: 0 
          },
          create: { 
            EmailUsuario: Email, IdCancion: songId, MinutoEscucha: 0 
          },

        });
      
        if (!user) {
          throw new Error(`Usuario con email ${Email} no encontrado.`);
        }
      
        return user;
    }

    async updateSongTime(email: string, songId: number, currentTime: number) {
        // Usamos upsert si tu tabla se llama "CancionEscuchando"
        // y la clave primaria  es [EmailUsuario].
        return this.prisma.cancionEscuchando.upsert({
          where: {
              EmailUsuario: email
          },
          update: {
            MinutoEscucha: currentTime,
          },
          create: {
            EmailUsuario: email,
            IdCancion: songId,
            MinutoEscucha: currentTime,
          },
        });
      }

}
