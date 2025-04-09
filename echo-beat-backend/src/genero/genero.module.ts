import { Module } from '@nestjs/common';
import { GeneroService } from './genero.service';
import { GeneroController } from './genero.controller';
import { PrismaModule } from '../prisma/prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [GeneroController],
  providers: [GeneroService],
  exports: [GeneroService]
})
export class GeneroModule {}
