import { Module } from '@nestjs/common';
import { ColaReproduccionController } from './cola-reproduccion.controller';
import { ColaReproduccionService } from './cola-reproduccion.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ColaReproduccionController],
  providers: [ColaReproduccionService, PrismaService],
  exports: [ColaReproduccionService]
})
export class ColaReproduccionModule { }
