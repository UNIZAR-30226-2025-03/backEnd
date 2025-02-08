import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { ChatGateway } from './chat/chat.gateway';
import { PrismaService } from './prisma/prisma.service';
import { StreamingModule } from './streaming/streaming.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [AuthModule, UsersModule, PlaylistsModule, StreamingModule, SearchModule],
  controllers: [AppController],
  providers: [AppService, ChatGateway, PrismaService],
})
export class AppModule {}
