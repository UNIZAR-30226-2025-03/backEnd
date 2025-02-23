import { Module } from '@nestjs/common';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PlaylistsController],
  providers: [PlaylistsService, PrismaService],
  exports: [PlaylistsService]
})
export class PlaylistsModule {}
