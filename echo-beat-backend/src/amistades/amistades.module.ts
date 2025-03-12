import { Module } from '@nestjs/common';
import { AmistadesController } from './amistades.controller';
import { AmistadesService } from './amistades.service';

@Module({
  controllers: [AmistadesController],
  providers: [AmistadesService]
})
export class AmistadesModule {}
