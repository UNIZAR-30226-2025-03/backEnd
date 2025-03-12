import { Module } from '@nestjs/common';
import { AmistadesController } from './amistades.controller';
import { AmistadesService } from './amistades.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AmistadesController],
  providers: [AmistadesService, PrismaService]
})
export class AmistadesModule {}
