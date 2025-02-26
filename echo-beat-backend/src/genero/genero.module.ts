import { Module } from '@nestjs/common';
import { GeneroService } from './genero.service';
import { GeneroController } from './genero.controller';

@Module({
  providers: [GeneroService],
  controllers: [GeneroController]
})
export class GeneroModule {}
