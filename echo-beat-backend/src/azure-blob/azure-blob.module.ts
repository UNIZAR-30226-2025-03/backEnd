import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AzureBlobService } from './azure-blob.service';

@Module({
  imports: [ConfigModule],
  providers: [AzureBlobService],
  exports: [AzureBlobService],
})
export class AzureBlobModule {}