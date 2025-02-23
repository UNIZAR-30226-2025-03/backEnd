import { Module } from '@nestjs/common';
import { StreamingGateway } from './streaming.gateway';
import { AzureBlobModule } from '../azure-blob/azure-blob.module';
import { PlaylistsModule } from '../playlists/playlists.module';

@Module({
  imports: [AzureBlobModule, PlaylistsModule],
  providers: [StreamingGateway],
  exports: [StreamingGateway],
})
export class StreamingModule {}