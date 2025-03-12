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
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AzureBlobModule } from './azure-blob/azure-blob.module';
import { GeneroModule } from './genero/genero.module';
import { AmistadesModule } from './amistades/amistades.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true, // Hace que las variables de entorno estén disponibles globalmente
    envFilePath: '.env',
  }),AuthModule, UsersModule, PlaylistsModule, StreamingModule, SearchModule, PrismaModule, AzureBlobModule, GeneroModule, AmistadesModule],
  controllers: [AppController],
  providers: [AppService, ChatGateway, PrismaService],
})
export class AppModule {}
