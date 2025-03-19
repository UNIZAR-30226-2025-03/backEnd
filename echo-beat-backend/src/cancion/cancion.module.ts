import { Module } from '@nestjs/common';
import { CancionService } from './cancion.service';
import { CancionController } from './cancion.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CancionController],
  providers: [CancionService],
  exports: [CancionService],
})
export class CancionModule {}