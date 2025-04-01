import { Module } from '@nestjs/common';
import { ArtistasService } from './artistas.service';
import { ArtistasController } from './artistas.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ArtistasService, PrismaService],
  controllers: [ArtistasController],
  exports: [ArtistasService]
})
export class ArtistasModule {}
