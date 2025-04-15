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
import { ColaReproduccionModule } from './cola-reproduccion/cola-reproduccion.module';
import { ChatModule } from './chat/chat.module';
import { CancionModule } from './cancion/cancion.module';
import { EstadoUsuarioModule } from './estado-usuario/estado-usuario.module';
import { ArtistasModule } from './artistas/artistas.module';
import { AdminModule } from './admin/admin.module';
import { GeminiModule } from './gemini/gemini.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true, // Hace que las variables de entorno estén disponibles globalmente
    envFilePath: '.env',
  }),AuthModule, UsersModule, PlaylistsModule, StreamingModule, SearchModule, PrismaModule, AzureBlobModule, GeneroModule, AmistadesModule, ColaReproduccionModule, ChatModule, CancionModule, EstadoUsuarioModule, ArtistasModule, AdminModule, GeminiModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
