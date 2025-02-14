import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService], // Registramos el PrismaService
  exports: [PrismaService],   // Lo exportamos para que esté disponible en otros módulos
})
export class PrismaModule {}
