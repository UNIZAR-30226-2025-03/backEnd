import { Module } from '@nestjs/common';
import { EstadoUsuarioService } from './estado-usuario.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [EstadoUsuarioService,PrismaService],
  exports: [EstadoUsuarioService]
})
export class EstadoUsuarioModule {}
